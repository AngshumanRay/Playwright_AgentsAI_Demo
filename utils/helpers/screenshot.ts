// =============================================================================
// utils/helpers/screenshot.ts — SCREENSHOT CAPTURE UTILITY
// =============================================================================
// PURPOSE:
//   Helper functions to capture and save screenshots during test execution.
//
// WHAT IS A SCREENSHOT IN TESTING?
//   A screenshot is an image of what the browser showed at a specific moment.
//   When tests fail, screenshots are the #1 debugging tool because they show:
//     - Was the wrong page displayed?
//     - Was there an error message on screen?
//     - Was the button/element not visible?
//
// PLAYWRIGHT'S SCREENSHOT FEATURE:
//   Playwright (our test framework) can take browser screenshots automatically.
//   We just call: page.screenshot({ path: 'my-screenshot.png' })
//   Playwright will capture exactly what Chrome/Firefox shows at that moment.
// =============================================================================

import * as fs   from 'fs';
import * as path from 'path';
import type { Page } from '@playwright/test';
import { logger } from './logger';

// The folder where all screenshots will be saved
// This folder is created automatically if it doesn't exist
const SCREENSHOTS_DIR = path.join(process.cwd(), 'test-results', 'screenshots');

// =============================================================================
// FUNCTION: captureScreenshot
// =============================================================================
// PURPOSE:
//   Takes a screenshot of the current browser state and saves it to disk.
//
// HOW IT WORKS:
//   1. Creates the screenshots folder if it doesn't exist
//   2. Generates a unique filename with timestamp (prevents overwrites)
//   3. Tells Playwright to capture the screenshot and save it
//   4. Returns the path where the file was saved
//
// PARAMETERS:
//   - page:      The Playwright Page object (represents the browser tab)
//   - testName:  A descriptive name for the screenshot (e.g., "login-failure")
//   - label:     Optional extra label (e.g., "before-click", "after-error")
//
// RETURNS:
//   The full file path of the saved screenshot, or null if capture failed.
//
// USAGE EXAMPLE:
//   const screenshotPath = await captureScreenshot(page, 'login-test', 'wrong-password');
//   // Saves: test-results/screenshots/login-test_wrong-password_2026-02-28T14-30-45.png
// =============================================================================
export async function captureScreenshot(
  page: Page,
  testName: string,
  label: string = 'screenshot'
): Promise<string | null> {

  try {
    // Create screenshots directory if it doesn't exist yet
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    // Build a safe, unique filename:
    //   - Replace spaces and slashes with underscores (can't have those in filenames)
    //   - Add a timestamp to make each screenshot unique
    //   - Use ISO format but replace colons with dashes (colons are invalid in filenames)
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const safeName  = testName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName  = `${safeName}_${safeLabel}_${timestamp}.png`;
    const filePath  = path.join(SCREENSHOTS_DIR, fileName);

    // Capture the screenshot using Playwright's built-in screenshot API
    // "fullPage: true" captures the ENTIRE page, not just the visible viewport
    await page.screenshot({
      path: filePath,
      fullPage: true,
    });

    logger.info(`📸 Screenshot saved: ${fileName}`);
    return filePath;

  } catch (error) {
    // Screenshot capture failed (maybe the page was already closed?)
    logger.warn(`Could not capture screenshot for "${testName}": ${error}`);
    return null;
  }
}

// =============================================================================
// FUNCTION: captureFailureScreenshot
// =============================================================================
// PURPOSE:
//   A convenience wrapper to capture a screenshot specifically when a test fails.
//   Adds "FAILURE" to the filename so it's easy to spot failed test screenshots.
//
// PARAMETERS:
//   - page:     The Playwright Page object
//   - testName: The name of the test that failed
//
// RETURNS:
//   The file path of the screenshot, or null if capture failed.
// =============================================================================
export async function captureFailureScreenshot(
  page: Page,
  testName: string
): Promise<string | null> {
  logger.step(`Capturing failure screenshot for: ${testName}`);
  return captureScreenshot(page, testName, 'FAILURE');
}
