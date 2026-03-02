// =============================================================================
// tests/global-teardown.ts — GLOBAL TEARDOWN (RUNS ONCE AFTER ALL TESTS)
// =============================================================================
// PURPOSE:
//   This file runs ONCE after ALL tests have finished. It's the "cleanup crew".
//
// WHAT IS "GLOBAL TEARDOWN"?
//   The counterpart to globalSetup. It runs after every single test is done.
//   This is the perfect place to:
//     - Upload all collected test results to XRAY
//     - Send a Slack notification with the test summary
//     - Clean up test data from the database
//     - Generate a final report
//
// UTILITIES HANDLED HERE (each one skips gracefully if not configured):
//   🔹 XRAY     — Upload PASS/FAIL results + screenshots to JIRA
//   🔹 Slack    — Send test summary message to Slack channel
//   🔹 Database — Clean up test data seeded during setup
//
// EXECUTION ORDER:
//   1. Upload results to XRAY (if configured)
//   2. Send Slack notification (if configured)
//   3. Clean up database test data (if configured)
//   4. Clean up state file
// =============================================================================

// Import Playwright's FullConfig type
import { type FullConfig } from '@playwright/test';

// Import XRAY result updater and state utilities
import { updateMultipleTestResults } from '../utils/jira-xray/xray-result-updater';
import { readXrayState, clearXrayState }   from '../utils/jira-xray/xray-state';
import { getTestExecutionStatus }          from '../utils/jira-xray/xray-test-execution';

// Import optional utility functions
import { isSlackConfigured, sendSlackNotification } from '../utils/slack/slack-notifier';
import { isDbConfigured, cleanupTestData }          from '../utils/database/test-data-manager';

// Import logger
import { logger } from '../utils/helpers/logger';

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

  // If the execution key is "NOT_CONFIGURED", XRAY setup was skipped
  if (state.executionKey === 'NOT_CONFIGURED') {
    logger.warn('XRAY was not configured (execution key is NOT_CONFIGURED).');
    logger.warn('Tests ran, but results were not uploaded to XRAY.');
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
  // STEP 5: Clean Up State File
  // ==========================================================================
  clearXrayState();

  // ==========================================================================
  // SLACK: Send Test Summary Notification (if configured)
  // ==========================================================================
  // After XRAY upload is done, send a summary to Slack so the team knows.
  // This runs even if XRAY was not configured — Slack is independent.
  // ==========================================================================
  if (isSlackConfigured()) {
    logger.section('📨 SLACK — Sending Test Summary');

    const totalTests = state.results.length;
    const passed     = state.results.filter((r) => r.status === 'PASS').length;
    const failed     = state.results.filter((r) => r.status === 'FAIL').length;
    const skipped    = totalTests - passed - failed;
    const totalDuration = state.results.reduce((sum, r) => sum + (r.durationMs || 0), 0);
    const failedNames   = state.results
      .filter((r) => r.status === 'FAIL')
      .map((r) => r.testCaseKey);

    await sendSlackNotification({
      totalTests,
      passed,
      failed,
      skipped,
      durationMs:    totalDuration,
      executionKey:  state.executionKey,
      failedTests:   failedNames,
    });
  } else {
    logger.info('Slack not configured — skipping notification.');
  }

  // ==========================================================================
  // DATABASE: Clean Up Seeded Test Data (if configured)
  // ==========================================================================
  // Remove any test data that was seeded during global setup.
  // This keeps the database clean between test runs.
  // ==========================================================================
  if (isDbConfigured()) {
    logger.section('🗃️  DATABASE — Cleaning Up Test Data');
    await cleanupTestData();
  }

  logger.section('✅ GLOBAL TEARDOWN COMPLETE — All done!');
}
