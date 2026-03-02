// =============================================================================
// pages/BasePage.ts — BASE PAGE CLASS (Page Object Model Foundation)
// =============================================================================
// PURPOSE:
//   This is the PARENT class that all other page classes inherit from.
//   It provides common, reusable browser actions that every page needs.
//
// WHAT IS THE PAGE OBJECT MODEL (POM)?
//   POM is a design pattern for organizing automation code. The idea is:
//     - Each PAGE of your web app gets its OWN CLASS (TypeScript file)
//     - The class holds:
//         a) LOCATORS: How to find elements on that page (buttons, inputs, etc.)
//         b) ACTIONS:  Methods that perform specific actions on that page
//     - Tests use these classes instead of directly interacting with the browser
//
//   BENEFITS of POM:
//     ✅ If a button's location changes, you only fix it in ONE place
//     ✅ Tests are easier to read (e.g., "loginPage.clickLoginButton()")
//     ✅ Code is reusable across many tests
//
// INHERITANCE (extends):
//   "extends BasePage" means a page class INHERITS all methods from BasePage.
//   Think of it like a recipe template:
//     - BasePage = base recipe with common techniques (boil water, season, etc.)
//     - LoginPage = specific recipe that uses the base techniques + its own steps
//
// WHAT IS A "LOCATOR"?
//   A locator is a description of HOW to find an HTML element on a web page.
//   Examples:
//     - By text:  page.getByRole('button', { name: 'Login' })
//     - By ID:    page.locator('#username')
//     - By CSS:   page.locator('.submit-btn')
//     - By label: page.getByLabel('Email address')
//   Playwright uses locators to find and interact with elements.
// =============================================================================

// Import Playwright types
// "Page" represents a single browser tab
// "Locator" represents a way to find an element on the page
import { type Page, type Locator, expect } from '@playwright/test';

// Import our logger for consistent, formatted output
import { logger } from '../utils/helpers/logger';

// Import screenshot helper for capturing failure evidence
import { captureFailureScreenshot } from '../utils/helpers/screenshot';

// =============================================================================
// CLASS: BasePage
// =============================================================================
// All page classes in the "pages/" folder will extend (inherit from) this class.
// You should NOT instantiate BasePage directly — always use a specific page class.
// =============================================================================
export class BasePage {

  // The Playwright "Page" object — represents the actual browser tab
  // "protected" means this is accessible in BasePage AND all child classes,
  // but NOT accessible from outside the class hierarchy (e.g., from test files)
  protected page: Page;

  // The base URL of the application (loaded from environment config)
  protected baseUrl: string;

  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  // PURPOSE:
  //   A constructor is the function that runs when you create a new object.
  //   Here: const loginPage = new LoginPage(page) → this constructor runs
  //
  // PARAMETERS:
  //   - page:    The Playwright Page object (passed in from the test)
  //   - baseUrl: The app's base URL (defaults to environment config value)
  // ==========================================================================
  constructor(page: Page, baseUrl: string = process.env['BASE_URL'] || '') {
    this.page    = page;
    this.baseUrl = baseUrl;
  }

  // ==========================================================================
  // METHOD: dismissCookieBanner
  // ==========================================================================
  // PURPOSE:
  //   Tries to find and click common cookie consent / "Accept All" buttons
  //   that many websites show on first visit.
  //
  // WHY IS THIS NEEDED?
  //   A cookie banner is a popup asking "Do you accept cookies?"
  //   If it appears on top of the page, Playwright cannot click the buttons
  //   underneath it — causing tests to fail for the wrong reason.
  //   This method looks for common "Accept" buttons and clicks them if found.
  //   If no cookie banner exists on the page, it silently does nothing.
  //
  // COMMON BUTTON TEXTS THIS HANDLES:
  //   "Accept All", "Accept Cookies", "I Accept", "OK", "Got it",
  //   "Allow All", "Agree", "Continue"
  //
  // USAGE: Call this after navigating to any page that may show a cookie banner.
  //   await basePage.dismissCookieBanner();
  // ==========================================================================
  async dismissCookieBanner(): Promise<void> {
    // List of common button texts used by cookie consent banners
    // We check for each one and click the first one that's visible
    const cookieButtonTexts = [
      /accept all/i,
      /accept cookies/i,
      /i accept/i,
      /allow all/i,
      /agree/i,
      /got it/i,
      /ok, got it/i,
      /continue/i,
    ];

    for (const text of cookieButtonTexts) {
      const btn = this.page.getByRole('button', { name: text });
      try {
        // Check if a button with this text is visible (timeout: 1 second)
        // We use a very short timeout so this check is fast if the button isn't there
        await btn.waitFor({ state: 'visible', timeout: 1000 });
        await btn.click();
        logger.info(`🍪 Cookie banner dismissed (clicked: "${text}")`);
        return; // Found and clicked — no need to check other texts
      } catch {
        // This button text wasn't found — try the next one
      }
    }
    // No cookie banner found — that's fine, many sites don't have one
  }

  // ==========================================================================
  // METHOD: navigate
  // ==========================================================================
  // PURPOSE:
  //   Opens a specific URL in the browser.
  //
  // HOW IT WORKS:
  //   - If you pass a relative path like "/login", it combines it with baseUrl
  //   - If you pass a full URL like "https://...", it uses that directly
  //   - After navigation, waits for the page to fully load
  //
  // PARAMETERS:
  //   - urlOrPath: Either a full URL or a path relative to baseUrl (e.g., "/login")
  //
  // USAGE EXAMPLE:
  //   await loginPage.navigate('/login');     // Opens baseUrl + "/login"
  //   await loginPage.navigate('https://google.com'); // Opens Google
  // ==========================================================================
  async navigate(urlOrPath: string): Promise<void> {
    // Determine the full URL
    const fullUrl = urlOrPath.startsWith('http')
      ? urlOrPath
      : `${this.baseUrl}${urlOrPath}`;

    logger.step(`Navigating to: ${fullUrl}`);

    // "goto" is Playwright's command to open a URL
    // "waitUntil: 'domcontentloaded'" means "wait until the HTML is parsed"
    // (not waiting for images/scripts, which would be 'networkidle' — slower)
    await this.page.goto(fullUrl, { waitUntil: 'domcontentloaded' });

    logger.info(`Page loaded: ${await this.page.title()}`);
  }

  // ==========================================================================
  // METHOD: clickElement
  // ==========================================================================
  // PURPOSE:
  //   Clicks on an element on the page (button, link, checkbox, etc.)
  //
  // WHY NOT JUST USE page.click()?
  //   This wrapper adds:
  //   - Logging (we can see exactly what was clicked in test output)
  //   - Error handling (better error message if element is not found)
  //   - Retry logic (Playwright retries automatically, but we log it)
  //
  // PARAMETERS:
  //   - locator:     A Playwright Locator describing which element to click
  //   - description: A human-readable description for logging (e.g., "Login button")
  // ==========================================================================
  async clickElement(locator: Locator, description: string): Promise<void> {
    logger.step(`Clicking: ${description}`);

    try {
      // Wait for the element to be visible before clicking
      // Playwright auto-waits, but we explicitly wait to get better error messages
      await locator.waitFor({ state: 'visible', timeout: 10000 });

      // Perform the click
      await locator.click();

      logger.info(`Clicked: ${description}`);
    } catch (error) {
      logger.error(`Failed to click: ${description}`, error);
      throw error; // Re-throw so the test knows this step failed
    }
  }

  // ==========================================================================
  // METHOD: fillInputField
  // ==========================================================================
  // PURPOSE:
  //   Types text into an input field (text box, password field, search box, etc.)
  //
  // PARAMETERS:
  //   - locator:     The input field locator
  //   - text:        The text to type into the field
  //   - description: Human-readable name (e.g., "Username field")
  // ==========================================================================
  async fillInputField(locator: Locator, text: string, description: string): Promise<void> {
    logger.step(`Filling "${description}" with: ${text}`);

    try {
      await locator.waitFor({ state: 'visible', timeout: 10000 });

      // "clear()" removes any existing text in the field first
      await locator.clear();

      // "fill()" types the text into the field
      // (More reliable than "type()" which simulates keystrokes one by one)
      await locator.fill(text);

      logger.info(`Filled: ${description}`);
    } catch (error) {
      logger.error(`Failed to fill: ${description}`, error);
      throw error;
    }
  }

  // ==========================================================================
  // METHOD: waitForElement
  // ==========================================================================
  // PURPOSE:
  //   Waits for an element to appear on the page (useful after clicks/navigation
  //   when a new element loads dynamically).
  //
  // PARAMETERS:
  //   - locator:     The element to wait for
  //   - description: Human-readable name for logging
  //   - timeout:     How many milliseconds to wait (default: 10 seconds)
  // ==========================================================================
  async waitForElement(locator: Locator, description: string, timeout: number = 10000): Promise<void> {
    logger.step(`Waiting for: ${description}`);

    try {
      await locator.waitFor({ state: 'visible', timeout });
      logger.info(`Found: ${description}`);
    } catch (error) {
      logger.error(`Timed out waiting for: ${description}`, error);
      throw error;
    }
  }

  // ==========================================================================
  // METHOD: assertElementVisible
  // ==========================================================================
  // PURPOSE:
  //   Checks (asserts) that an element IS visible on the page.
  //   If the element is NOT visible, the test FAILS immediately.
  //
  // WHAT IS AN ASSERTION?
  //   An assertion is a statement that says "I expect X to be true."
  //   If X is NOT true, the test fails with a clear message.
  //   Example: "I expect the welcome banner to be visible after login."
  //   If it's not visible → test fails → we know something is wrong.
  //
  // PARAMETERS:
  //   - locator:     The element to check
  //   - description: What element we're checking (for clear error messages)
  // ==========================================================================
  async assertElementVisible(locator: Locator, description: string): Promise<void> {
    logger.step(`Asserting visible: ${description}`);

    // "expect(...).toBeVisible()" is Playwright's assertion
    // If the element is not visible, Playwright throws an error with a clear message
    await expect(locator).toBeVisible({ timeout: 10000 });

    logger.info(`✅ Visible: ${description}`);
  }

  // ==========================================================================
  // METHOD: assertElementText
  // ==========================================================================
  // PURPOSE:
  //   Checks that an element contains the expected text.
  //
  // PARAMETERS:
  //   - locator:       The element to check
  //   - expectedText:  The text the element should contain
  //   - description:   What element we're checking
  // ==========================================================================
  async assertElementText(locator: Locator, expectedText: string, description: string): Promise<void> {
    logger.step(`Asserting text of "${description}" contains: "${expectedText}"`);

    await expect(locator).toContainText(expectedText, { timeout: 10000 });

    logger.info(`✅ Text verified for: ${description}`);
  }

  // ==========================================================================
  // METHOD: getPageTitle
  // ==========================================================================
  // PURPOSE:
  //   Returns the title of the current page (what you see in the browser tab).
  //   Useful for verifying you navigated to the right page.
  //
  // RETURNS:
  //   The page title as a string (e.g., "Welcome | MyApp")
  // ==========================================================================
  async getPageTitle(): Promise<string> {
    const title = await this.page.title();
    logger.info(`Current page title: "${title}"`);
    return title;
  }

  // ==========================================================================
  // METHOD: getCurrentUrl
  // ==========================================================================
  // PURPOSE:
  //   Returns the current URL in the browser's address bar.
  //   Useful for verifying navigation (e.g., "Did the user get redirected?")
  //
  // RETURNS:
  //   The full URL as a string (e.g., "https://myapp.com/dashboard")
  // ==========================================================================
  getCurrentUrl(): string {
    const url = this.page.url();
    logger.info(`Current URL: ${url}`);
    return url;
  }

  // ==========================================================================
  // METHOD: captureScreenshotOnFailure
  // ==========================================================================
  // PURPOSE:
  //   Takes a screenshot and returns its file path.
  //   Should be called in a test's afterEach hook when a test fails.
  //   The screenshot is later attached as evidence to the XRAY test result.
  //
  // PARAMETERS:
  //   - testName: The name of the test that failed
  //
  // RETURNS:
  //   File path of the screenshot, or null if capture failed.
  // ==========================================================================
  async captureScreenshotOnFailure(testName: string): Promise<string | null> {
    return captureFailureScreenshot(this.page, testName);
  }

  // ==========================================================================
  // METHOD: waitForPageLoad
  // ==========================================================================
  // PURPOSE:
  //   Waits for the browser to finish loading the current page.
  //   Useful after clicking a link or submitting a form.
  //
  // PARAMETERS:
  //   - state: What to wait for:
  //     - 'domcontentloaded': HTML parsed (fastest)
  //     - 'load':             All resources loaded (default)
  //     - 'networkidle':      No network requests for 500ms (slowest, most complete)
  // ==========================================================================
  async waitForPageLoad(state: 'domcontentloaded' | 'load' | 'networkidle' = 'load'): Promise<void> {
    logger.step(`Waiting for page load (state: ${state})`);
    await this.page.waitForLoadState(state);
    logger.info('Page load complete.');
  }
}
