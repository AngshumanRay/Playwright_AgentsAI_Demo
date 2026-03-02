// =============================================================================
// tests/xray-test-fixture.ts — CUSTOM PLAYWRIGHT TEST FIXTURE WITH XRAY
// =============================================================================
// PURPOSE:
//   This file creates a CUSTOM "test" function that extends Playwright's default
//   test function with automatic XRAY result reporting built in.
//
// WHAT IS A "FIXTURE" IN PLAYWRIGHT?
//   A fixture is a reusable setup/teardown piece that is automatically injected
//   into your tests. Think of it like a "smart wrapper" around your test.
//
//   Playwright's default fixtures provide things like: page, browser, context
//   Our custom fixture adds: xrayTestKey, automatic result upload to XRAY
//
// HOW TESTS USE THIS:
//   Instead of: import { test, expect } from '@playwright/test';
//   Tests use:  import { test, expect } from './xray-test-fixture';
//
//   The only difference in the test code is specifying the XRAY test key:
//     test('my test name', { tag: '@PROJ-101' }, async ({ page, xrayTestKey }) => {
//       // xrayTestKey is automatically "PROJ-101" from the tag
//       // After the test, result is automatically sent to XRAY!
//     });
//
// WHAT HAPPENS AUTOMATICALLY (you don't need to write this in every test):
//   BEFORE each test: Nothing special — just provides the xrayTestKey
//   AFTER each test:
//     - Captures screenshot if test FAILED
//     - Reads the test result (pass/fail)
//     - Saves result to shared state file (to be uploaded in global teardown)
// =============================================================================

// Import Playwright's test and expect, plus types
import { test as base, expect } from '@playwright/test';

// Import XRAY state utility to save results
import { appendTestResult } from './xray-state-helper';

// Import screenshot helper
import { captureFailureScreenshot } from '../utils/helpers/screenshot';

// Import the logger
import { logger } from '../utils/helpers/logger';

// =============================================================================
// TYPE: Define what extra things our custom fixture provides
// =============================================================================
// "xrayTestKey" is a string that holds the JIRA issue key for the current test.
// It's extracted from the test's annotations.
type XrayFixtures = {
  xrayTestKey: string;
};

// =============================================================================
// CUSTOM TEST FUNCTION
// =============================================================================
// "base.extend<XrayFixtures>()" creates a new test function that includes
// everything from the base Playwright test PLUS our custom xrayTestKey fixture.
// =============================================================================
export const test = base.extend<XrayFixtures>({

  // --------------------------------------------------------------------------
  // FIXTURE: xrayTestKey
  // --------------------------------------------------------------------------
  // PURPOSE:
  //   Extracts the XRAY test case key from the test's annotations,
  //   and after the test runs, automatically saves the result to shared state.
  //
  // HOW IT WORKS:
  //   1. Before test: Reads the test's annotations to find the XRAY key ("PROJ-101")
  //   2. Handles any cookie banners / popups so they don't break tests
  //   3. "use(xrayTestKey)" → passes the key into the test function
  //   4. After test:  Reads result (pass/fail), captures screenshot if failed,
  //                   saves result to the shared state file
  //
  // In the test file, use annotations to specify the XRAY test key:
  //   test('my test', { annotation: { type: 'xray', description: 'PROJ-101' } }, async ({ xrayTestKey }) => {
  //     console.log(xrayTestKey); // "PROJ-101"
  //   });
  // --------------------------------------------------------------------------
  xrayTestKey: async ({ page }, use, testInfo) => {
    // -----------------------------------------------------------------------
    // PRE-TEST: Extract the XRAY test key from test annotations or tags
    // -----------------------------------------------------------------------
    // Playwright TestInfo has an "annotations" array where we look for the XRAY key.
    // We look for an annotation like: { type: 'xray', description: 'PROJ-101' }
    let xrayKey = 'UNTRACKED'; // Default: test is not linked to XRAY

    // Search through the test's annotations for our XRAY annotation
    const xrayAnnotation = testInfo.annotations.find(
      (annotation) => annotation.type.toLowerCase() === 'xray'
    );

    if (xrayAnnotation?.description) {
      xrayKey = xrayAnnotation.description.trim();
      logger.info(`📎 Test linked to XRAY: ${xrayKey}`);
    } else {
      logger.warn(`Test "${testInfo.title}" has no XRAY annotation — results won't be uploaded.`);
    }

    // Record when this test started
    const startedAt = new Date().toISOString();

    // -----------------------------------------------------------------------
    // COOKIE BANNER & POPUP HANDLING
    // -----------------------------------------------------------------------
    // Many websites show a cookie consent popup when you first visit.
    // If the popup blocks the page, Playwright cannot click other elements
    // and the test will fail for the wrong reason.
    //
    // We register a DIALOG handler BEFORE the test runs so that:
    //   - Any browser alert/confirm/prompt dialogs are auto-accepted
    //   - The test never gets stuck waiting for a human to click "OK"
    //
    // "page.on('dialog', ...)" means: "Every time a popup dialog appears,
    //  run this function automatically."
    page.on('dialog', async (dialog) => {
      // Log what kind of dialog appeared (alert, confirm, prompt, beforeunload)
      logger.info(`🍪 Auto-accepting dialog: [${dialog.type()}] "${dialog.message()}"`);
      // "accept()" clicks OK / Yes / Accept on the dialog
      await dialog.accept();
    });

    // -----------------------------------------------------------------------
    // RUN THE TEST
    // -----------------------------------------------------------------------
    // "use(xrayKey)" passes the key into the test function.
    // All the test's code runs here. After it returns, we're in the "post-test" phase.
    await use(xrayKey);

    // -----------------------------------------------------------------------
    // POST-TEST: Save result to shared state for global teardown to upload
    // -----------------------------------------------------------------------
    const finishedAt = new Date().toISOString();
    const durationMs = testInfo.duration; // Playwright measures this for us

    // "testInfo.status" is set by Playwright:
    //   'passed'  → test assertions all passed
    //   'failed'  → a test assertion failed
    //   'timedOut'→ test took too long
    //   'skipped' → test was skipped
    const playwrightStatus = testInfo.status;

    // Map Playwright status → XRAY status
    // XRAY uses "PASS"/"FAIL", Playwright uses "passed"/"failed"
    let xrayStatus: 'PASS' | 'FAIL' | 'ABORTED' = 'PASS';
    if (playwrightStatus === 'failed' || playwrightStatus === 'timedOut') {
      xrayStatus = 'FAIL';
    } else if (playwrightStatus === 'interrupted') {
      xrayStatus = 'ABORTED';
    }

    // Only save results for tests that are linked to XRAY
    if (xrayKey !== 'UNTRACKED') {

      // If the test failed, capture a screenshot as evidence
      let screenshotPath: string | undefined;
      if (xrayStatus === 'FAIL') {
        logger.step(`Capturing failure screenshot for: ${testInfo.title}`);
        const shot = await captureFailureScreenshot(page, testInfo.title);
        if (shot) screenshotPath = shot;
      }

      // Build the error message from Playwright's test error info
      let errorMessage: string | undefined;
      if (testInfo.errors.length > 0) {
        // Combine all error messages (there could be multiple assertion failures)
        errorMessage = testInfo.errors
          .map((e) => e.message || String(e))
          .join('\n\n');
      }

      // Save the result to the shared state file
      // Global teardown will read this and upload all results to XRAY at the end
      appendTestResult({
        testCaseKey:  xrayKey,
        status:       xrayStatus,
        errorMessage,
        screenshotPath,
        durationMs,
        startedAt,
        finishedAt,
      });

      // Log the result
      if (xrayStatus === 'PASS') {
        logger.pass(`[${xrayKey}] ${testInfo.title}`);
      } else {
        logger.fail(`[${xrayKey}] ${testInfo.title}`, errorMessage);
      }
    }
  },
});

// Re-export "expect" from Playwright (tests need this for assertions)
export { expect };
