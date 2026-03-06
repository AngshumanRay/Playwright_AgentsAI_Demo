// =============================================================================
// utils/framework/global-teardown.ts — GLOBAL TEARDOWN (RUNS ONCE AFTER ALL TESTS)
// =============================================================================
// PURPOSE:
//   This file runs ONCE after ALL tests have finished. It's the "cleanup crew".
//
// WHAT IS "GLOBAL TEARDOWN"?
//   The counterpart to globalSetup. It runs after every single test is done.
//   This is the perfect place to:
//     - Upload all collected test results to XRAY (AUTOMATED — no manual work)
//     - Generate the HTML execution report
//     - Clean up test data from the database
//
// MANUAL vs AUTOMATED (XRAY):
//   Everything in this file is FULLY AUTOMATED. The results collected during
//   test runs are uploaded to JIRA XRAY automatically:
//     - PASS/FAIL status → updated in the Test Execution
//     - Failure screenshots → attached as evidence in JIRA
//     - Error messages → included in the test run comment
//   QA never needs to manually mark PASS/FAIL in JIRA.
//
// UTILITIES HANDLED HERE (each one skips gracefully if not configured):
//   🔹 XRAY     — Upload PASS/FAIL results + full test names + screenshots to JIRA
//   🔹 Report   — Generate the HTML execution report (always runs, XRAY optional)
//   🔹 Database — Clean up test data seeded during global-setup
//
// EXECUTION ORDER:
//   1. Read xray-state.json (results saved by xray-test-fixture.ts during tests)
//   2. Upload results to XRAY (if execution key is configured)
//   3. Fetch final execution status from XRAY (to confirm upload)
//   4. Clear xray-state.json (so next run starts fresh)
//   5. Generate HTML report (reports/execution-report-YYYY-MM-DD.html)
//   6. Clean up database test data (if DB_ENABLED=true)
// =============================================================================

// Import Playwright's FullConfig type
import { type FullConfig } from '@playwright/test';

// Import XRAY result updater and state utilities
import { updateMultipleTestResults } from '../jira-xray/xray-result-updater';
import { readXrayState, clearXrayState }   from '../jira-xray/xray-state';
import { getTestExecutionStatus }          from '../jira-xray/xray-test-execution';

// Import optional utility functions
import { isDbConfigured, cleanupTestData }          from '../database/test-data-manager';

// Import report generator (generates a beautiful HTML report with charts)
import { generateReport } from '../reporting/report-generator';

// Import enhanced logger (collects structured data for the report)
import { enhancedLogger } from '../helpers/enhanced-logger';

// Import logger
import { logger } from '../helpers/logger';

// Import config
import { config } from '../../config/environment';

// =============================================================================
// GLOBAL TEARDOWN FUNCTION
// =============================================================================
// Playwright calls this automatically after all tests finish.
// =============================================================================
export default async function globalTeardown(_config: FullConfig): Promise<void> {
  logger.section('🏁 GLOBAL TEARDOWN — Post-Run Utilities');

  // ==========================================================================
  // STEP 1: Read the Shared State
  // ==========================================================================
  // Read the state file saved by global-setup.ts.
  // This gives us: the execution key + all test results collected during the run.
  const state = readXrayState();

  if (!state) {
    logger.warn('No XRAY state found. Either setup was skipped, or it failed.');
    logger.warn('Test results will NOT be uploaded to XRAY.');
    return;
  }

  // If the execution key is "NOT_CONFIGURED", XRAY upload is skipped,
  // but we STILL want to generate the HTML report.
  if (state.executionKey === 'NOT_CONFIGURED') {
    logger.warn('XRAY was not configured (execution key is NOT_CONFIGURED).');
    logger.warn('Tests ran, but results were not uploaded to XRAY.');

    // Still generate the HTML report even without XRAY
    // IMPORTANT: Generate report BEFORE clearing state (report reads perf/a11y data)
    await runPostRunTasks(state, _config);

    // Write PASS/FAIL summary to the TOP of the log file
    writeLogFileSummary(state);

    clearXrayState();
    return;
  }

  logger.info(`Uploading results to Test Execution: ${state.executionKey}`);
  logger.info(`Total results to upload: ${state.results.length}`);

  // ==========================================================================
  // STEP 2: Summarize Results Before Uploading
  // ==========================================================================
  const passedTests  = state.results.filter((r) => r.status === 'PASS');
  const failedTests  = state.results.filter((r) => r.status === 'FAIL');
  const abortedTests = state.results.filter((r) => r.status === 'ABORTED');

  logger.info(`Results summary BEFORE upload:`);
  logger.info(`  ✅ Passed:  ${passedTests.length}`);
  logger.info(`  ❌ Failed:  ${failedTests.length}`);
  logger.info(`  🔶 Aborted: ${abortedTests.length}`);

  if (failedTests.length > 0) {
    logger.warn('Failed tests:');
    failedTests.forEach((r) => {
      logger.fail(r.testCaseKey, r.errorMessage || 'No error message');
    });
  }

  // ==========================================================================
  // STEP 3: Upload Results to XRAY
  // ==========================================================================
  // If there are results to upload, send them all to XRAY now.
  if (state.results.length === 0) {
    logger.warn('No test results to upload. Were any tests mapped to XRAY test cases?');
  } else {
    logger.step(`Uploading ${state.results.length} result(s) to XRAY...`);

    const { successCount, failureCount } = await updateMultipleTestResults(
      state.executionKey,
      state.results
    );

    logger.info(`Upload complete: ${successCount} succeeded, ${failureCount} failed.`);
  }

  // ==========================================================================
  // STEP 4: Fetch and Log Final Execution Status from XRAY
  // ==========================================================================
  // After uploading, fetch the execution status from XRAY to confirm
  // the results were recorded correctly.
  logger.step('Fetching final execution status from XRAY...');
  const finalStatus = await getTestExecutionStatus(state.executionKey);

  if (finalStatus) {
    logger.section(
      `📊 FINAL XRAY EXECUTION STATUS\n` +
      `   Execution: ${state.executionKey}\n` +
      `   Sprint: ${state.sprintNumber}\n` +
      `   Total:   ${finalStatus.total}\n` +
      `   ✅ Passed:  ${finalStatus.passed}\n` +
      `   ❌ Failed:  ${finalStatus.failed}\n` +
      `   ⏳ Pending: ${finalStatus.pending}\n` +
      `\n   View in JIRA: ${process.env['JIRA_BASE_URL']}/browse/${state.executionKey}`
    );
  }

  // ==========================================================================
  // STEP 5: Generate Report + DB cleanup + Log Summary
  // ==========================================================================
  // IMPORTANT: Generate report BEFORE clearing state — the report reads
  // perf/a11y/log data from the shared state file (cross-process data).
  await runPostRunTasks(state, _config);

  // Write PASS/FAIL summary to the TOP of the log file
  writeLogFileSummary(state);

  clearXrayState();

  logger.section('✅ GLOBAL TEARDOWN COMPLETE — All done!\n   📂 Check reports/ for the HTML execution report.');
}

// =============================================================================
// HELPER: runPostRunTasks
// =============================================================================
// Runs the report generation and DB cleanup.
// Called both in the normal XRAY path AND the NOT_CONFIGURED path so the
// HTML report is ALWAYS generated regardless of XRAY configuration.
// =============================================================================
import { type FullConfig as _FullConfig } from '@playwright/test';

async function runPostRunTasks(state: NonNullable<ReturnType<typeof readXrayState>>, _config: _FullConfig): Promise<void> {
  // Generate HTML report
  logger.section('📊 REPORT — Generating HTML Execution Report');
  try {
    const today = new Date().toISOString().split('T')[0];
    const collectedData = enhancedLogger.getCollectedData();

    // Read perf/a11y/log data from shared state file (cross-process data from workers)
    const sharedState = readXrayState();
    const sharedPerf = sharedState?.perfData ?? [];
    const sharedA11y = sharedState?.a11yData ?? {};
    const sharedLogs = sharedState?.logEntries ?? [];

    // Merge: prefer shared (cross-process) data over in-memory (main process only)
    const mergedPerf = sharedPerf.length > 0 ? sharedPerf : collectedData.performance;
    const mergedA11y = Object.keys(sharedA11y).length > 0 ? sharedA11y : collectedData.accessibility;
    const mergedLogs = sharedLogs.length > 0 ? sharedLogs : collectedData.logs;

    await generateReport({
      runDate:      today,
      environment:  config.app.environment,
      testResults:  state.results.map(r => ({
        testCaseKey:    r.testCaseKey,
        status:         (['PASS','FAIL','ABORTED','EXECUTING'].includes(r.status)
          ? r.status
          : 'ABORTED') as 'PASS' | 'FAIL' | 'ABORTED' | 'EXECUTING',
        testName:       r.testName ?? r.testCaseKey,
        durationMs:     r.durationMs,
        errorMessage:   r.errorMessage,
        screenshotPath: r.screenshotPath,
        startedAt:      r.startedAt,
        finishedAt:     r.finishedAt,
      })),
      xrayLink:     state.executionKey !== 'NOT_CONFIGURED'
        ? `${process.env['JIRA_BASE_URL'] ?? ''}/browse/${state.executionKey}`
        : undefined,
      jiraBaseUrl:    process.env['JIRA_BASE_URL'],
      sprintNumber:   state.sprintNumber,
      runStartedAt:   state.runStartedAt,
      logEntries:   mergedLogs as any,
      perfData:     mergedPerf as any,
      a11yData:     mergedA11y as any,
    });
  } catch (err) {
    logger.warn(`Could not generate HTML report: ${(err as Error).message}`);
  }

  // DB cleanup
  if (isDbConfigured()) {
    logger.section('🗃️  DATABASE — Cleaning Up Test Data');
    await cleanupTestData();
  }
}

// =============================================================================
// HELPER: writeLogFileSummary
// =============================================================================
// Writes a PASS/FAIL summary at the TOP of the log file so anyone opening
// the log file immediately sees the overall test execution status.
// =============================================================================
function writeLogFileSummary(state: NonNullable<ReturnType<typeof readXrayState>>): void {
  logger.section('📋 LOG SUMMARY — Writing PASS/FAIL summary to log file');
  try {
    const summaryResults = state.results.map(r => ({
      testCaseKey:  r.testCaseKey,
      testName:     r.testName ?? r.testCaseKey,
      status:       r.status as 'PASS' | 'FAIL' | 'ABORTED',
      durationMs:   r.durationMs,
      errorMessage: r.errorMessage,
    }));

    enhancedLogger.writeTestSummaryToLogFile(summaryResults);

    const logPath = enhancedLogger.getLogFilePath();
    if (logPath) {
      logger.info(`✅ PASS/FAIL summary written to top of: ${logPath}`);
    }
  } catch (err) {
    logger.warn(`Could not write log summary: ${(err as Error).message}`);
  }
}
