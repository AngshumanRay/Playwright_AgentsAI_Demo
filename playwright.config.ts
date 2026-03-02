// =============================================================================
// playwright.config.ts — PLAYWRIGHT TEST RUNNER CONFIGURATION
// =============================================================================
// PURPOSE:
//   This is the MAIN configuration file for Playwright.
//   It controls HOW Playwright runs your tests:
//     - Which browser(s) to use
//     - How many tests to run at the same time (parallel vs. sequential)
//     - What to do when tests fail (retries, screenshots, videos)
//     - Global setup and teardown hooks
//     - Where to save test reports
//
// HOW PLAYWRIGHT USES THIS FILE:
//   When you run "npx playwright test", Playwright automatically reads this file.
//   You don't need to pass it as a parameter — it's auto-detected.
//
// OFFICIAL DOCS: https://playwright.dev/docs/test-configuration
// =============================================================================

// Import Playwright's configuration types
import { defineConfig, devices } from '@playwright/test';

// Load environment variables from .env BEFORE reading process.env
// "dotenv/config" reads the .env file and populates process.env
import 'dotenv/config';

// =============================================================================
// EXPORT DEFAULT CONFIGURATION
// =============================================================================
// "defineConfig()" wraps our configuration object and provides type-checking.
// TypeScript will catch typos or wrong values in this config.
// =============================================================================
export default defineConfig({

  // ==========================================================================
  // TEST DIRECTORY
  // ==========================================================================
  // Where Playwright looks for test files.
  // It will find any file matching the "testMatch" pattern below inside this folder.
  testDir: './tests',

  // ==========================================================================
  // TEST FILE PATTERN
  // ==========================================================================
  // Which files are test files? Only files matching this pattern will be run.
  // "**/*.test.ts" means: any .test.ts file in any subfolder under testDir
  // Example matches: tests/login.test.ts, tests/checkout/payment.test.ts
  testMatch: '**/*.test.ts',

  // ==========================================================================
  // PARALLEL EXECUTION
  // ==========================================================================
  // Should test FILES run in parallel (at the same time)?
  // true  = Multiple test files run simultaneously (faster, but uses more memory)
  // false = Test files run one after another (slower, but easier to debug)
  //
  // RECOMMENDATION FOR BEGINNERS: Set to false first, then enable when stable.
  fullyParallel: false,

  // ==========================================================================
  // WORKERS (PARALLEL TEST PROCESSES)
  // ==========================================================================
  // How many test workers (separate Node.js processes) to use.
  // More workers = faster, but more RAM/CPU usage.
  //
  // "process.env.CI ? 1 : 2" means:
  //   - On CI (Continuous Integration, like GitHub Actions): Use 1 worker (stable)
  //   - On your local machine: Use 2 workers (faster)
  workers: process.env['CI'] ? 1 : 2,

  // ==========================================================================
  // RETRIES ON FAILURE
  // ==========================================================================
  // How many times to retry a FAILED test before marking it as failed.
  //
  // Why retry? Some tests fail due to temporary issues (slow network, flaky UI).
  // Retrying catches these "flaky" failures without human intervention.
  //
  // "process.env.CI ? 2 : 0" means:
  //   - On CI: Retry up to 2 times (CI environments can be slower)
  //   - Locally: No retries (if it fails locally, we want to know immediately)
  retries: process.env['CI'] ? 2 : 0,

  // ==========================================================================
  // TEST TIMEOUT
  // ==========================================================================
  // Maximum time (in milliseconds) a SINGLE TEST can take before it's marked
  // as "timed out" (failed due to taking too long).
  //
  // 60,000ms = 60 seconds = 1 minute per test
  // Increase this if your tests involve slow operations (large file uploads, etc.)
  timeout: 60000,

  // ==========================================================================
  // EXPECT TIMEOUT
  // ==========================================================================
  // Maximum time for a single "expect()" assertion to wait.
  // Playwright auto-waits for assertions — this is how long it waits.
  // 10,000ms = 10 seconds for each assertion
  expect: {
    timeout: 10000,
  },

  // ==========================================================================
  // GLOBAL SETUP & TEARDOWN
  // ==========================================================================
  // Files to run ONCE before and after ALL tests.
  //
  // globalSetup:    Runs once before any test starts
  //   → Creates XRAY Test Execution, fetches test cases
  //
  // globalTeardown: Runs once after all tests finish
  //   → Uploads all results to XRAY
  globalSetup:    './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  // ==========================================================================
  // REPORTER
  // ==========================================================================
  // How to display test results after running.
  // You can have multiple reporters at the same time!
  //
  // Reporters available:
  //   'list'   → Simple list in the terminal (default)
  //   'html'   → Beautiful HTML report saved to playwright-report/
  //   'json'   → Results as a JSON file (for CI/CD processing)
  //   'dot'    → Minimal output (one dot per test — good for CI)
  //   'line'   → One line per test
  //
  // We use both "list" (for terminal readability) and "html" (for sharing reports)
  reporter: [
    // Terminal output — shows test names and pass/fail as tests run
    ['list'],

    // HTML report — open playwright-report/index.html after tests to see a
    // beautiful visual report with screenshots, traces, and error details
    ['html', {
      outputFolder: 'playwright-report',  // Where to save the HTML report
      open: 'never',                      // Don't auto-open browser after tests
                                          // Change to 'on-failure' to auto-open on failure
    }],
  ],

  // ==========================================================================
  // GLOBAL TEST SETTINGS (use)
  // ==========================================================================
  // Settings that apply to ALL tests unless overridden in the test file.
  use: {

    // ------------------------------------------------------------------------
    // BASE URL
    // ------------------------------------------------------------------------
    // The root URL of the application under test.
    // When tests call page.goto('/login'), Playwright prepends this URL.
    // Example: baseURL = "https://myapp.com" + "/login" = "https://myapp.com/login"
    baseURL: process.env['BASE_URL'],

    // ------------------------------------------------------------------------
    // HEADLESS MODE
    // ------------------------------------------------------------------------
    // headless: true  = Run browser in the BACKGROUND (no visible window) — faster
    // headless: false = Show the browser window — good for debugging
    //
    // "process.env.CI ? true : true" always runs headless.
    // Change to "false" locally when you want to WATCH the tests run.
    headless: true,

    // ------------------------------------------------------------------------
    // SCREENSHOT ON FAILURE
    // ------------------------------------------------------------------------
    // 'only-on-failure' → Take screenshot automatically when a test fails
    // 'on':              → Take screenshot after EVERY test
    // 'off':             → Never take screenshots automatically
    //
    // Screenshots are saved to test-results/ folder.
    screenshot: 'only-on-failure',

    // ------------------------------------------------------------------------
    // VIDEO RECORDING
    // ------------------------------------------------------------------------
    // 'on-first-retry' → Record video only when retrying a failed test
    // 'on':             → Always record (uses lots of disk space)
    // 'off':            → Never record
    //
    // Videos are great for debugging complex failures — you can watch exactly
    // what happened in the browser step by step.
    video: 'on-first-retry',

    // ------------------------------------------------------------------------
    // TRACES (Playwright Inspector recordings)
    // ------------------------------------------------------------------------
    // A "trace" is a detailed recording of all browser actions, network
    // requests, screenshots at each step, and console logs.
    //
    // 'on-first-retry' → Record trace only when retrying a failed test
    //
    // View traces with: npx playwright show-trace trace.zip
    trace: 'on-first-retry',

    // ------------------------------------------------------------------------
    // BROWSER VIEWPORT SIZE
    // ------------------------------------------------------------------------
    // The size of the browser window for tests.
    // 1280x720 is a common desktop resolution.
    viewport: { width: 1280, height: 720 },

    // ------------------------------------------------------------------------
    // ACTION TIMEOUT
    // ------------------------------------------------------------------------
    // Maximum time for a single ACTION (click, fill, etc.) before it times out.
    // 10 seconds per action is usually plenty for most web applications.
    actionTimeout: 10000,

    // ------------------------------------------------------------------------
    // NAVIGATION TIMEOUT
    // ------------------------------------------------------------------------
    // Maximum time to wait for a page navigation (page.goto(), page.click() that
    // triggers navigation, etc.) to complete.
    navigationTimeout: 30000,
  },

  // ==========================================================================
  // BROWSER PROJECTS
  // ==========================================================================
  // Define which browsers to run tests on.
  // Each "project" is a separate browser configuration.
  // Tests will be run in EACH project unless you specify otherwise.
  //
  // To run only specific browsers:
  //   npx playwright test --project=chromium
  //   npx playwright test --project=firefox
  projects: [
    {
      // -----------------------------------------------------------------------
      // PROJECT 1: Chromium (Google Chrome / Microsoft Edge engine)
      // -----------------------------------------------------------------------
      // Chromium is the open-source base of both Chrome and Edge.
      // This is the most widely used browser — always include it.
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],  // Use default Chrome-like settings
      },
    },

    // -----------------------------------------------------------------------
    // PROJECT 2: Firefox (Mozilla Firefox)
    // -----------------------------------------------------------------------
    // Uncomment this block to also run tests in Firefox.
    // Useful to catch browser-specific bugs.
    //
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    // },

    // -----------------------------------------------------------------------
    // PROJECT 3: WebKit (Apple Safari engine)
    // -----------------------------------------------------------------------
    // Uncomment to test in Safari (important for iOS/macOS users).
    //
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    // },

    // -----------------------------------------------------------------------
    // PROJECT 4: Mobile Chrome
    // -----------------------------------------------------------------------
    // Uncomment to test on a simulated mobile device (Google Pixel 5).
    //
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
  ],

  // ==========================================================================
  // OUTPUT DIRECTORY
  // ==========================================================================
  // Where to save test artifacts (screenshots, videos, traces).
  // Each test run creates a folder inside test-results/
  outputDir: 'test-results/',
});
