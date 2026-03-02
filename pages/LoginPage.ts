// =============================================================================
// pages/LoginPage.ts — LOGIN PAGE OBJECT
// =============================================================================
// PURPOSE:
//   This file represents the LOGIN PAGE of your web application.
//   It encapsulates (bundles together) everything related to the login page:
//     - The locators (where to find each element)
//     - The actions (what you can DO on this page)
//
// HOW TO USE THIS AS A TEMPLATE:
//   For every page in your application, create a similar file:
//     - pages/DashboardPage.ts  → For the dashboard/home page
//     - pages/ProfilePage.ts    → For the user profile page
//     - pages/CheckoutPage.ts   → For the checkout/payment page
//
//   Each page file follows the same pattern:
//     1. "extends BasePage" to inherit common actions (click, fill, navigate...)
//     2. Define locators for elements on THIS specific page
//     3. Define methods for actions specific to THIS page
//
// WHAT "extends BasePage" MEANS:
//   LoginPage INHERITS all methods from BasePage.
//   So LoginPage automatically has: navigate(), clickElement(), fillInputField(), etc.
//   You don't need to write those again — they come "for free" from BasePage.
// =============================================================================

// Import the Playwright Page type (represents the browser tab)
import { type Page } from '@playwright/test';

// Import the BasePage (our parent class with common methods)
import { BasePage } from './BasePage';

// Import the logger for consistent logging
import { logger } from '../utils/helpers/logger';

// =============================================================================
// CLASS: LoginPage
// =============================================================================
// "extends BasePage" means this class inherits everything from BasePage.
// Think of BasePage as the "general toolkit" and LoginPage as "specialized tools for login".
// =============================================================================
export class LoginPage extends BasePage {

  // ==========================================================================
  // LOCATORS (PRIVATE)
  // ==========================================================================
  // A locator tells Playwright HOW to find a specific element on the page.
  //
  // "private" means these can only be used INSIDE this class.
  // Tests should use the page's METHODS, not the locators directly.
  // This keeps the test code clean and independent of HTML structure.
  //
  // LOCATOR TYPES EXPLAINED:
  //   getByRole:    Finds elements by their semantic role (button, textbox, heading...)
  //                 BEST PRACTICE — works even if the HTML structure changes
  //                 Example: page.getByRole('button', { name: 'Sign In' })
  //
  //   getByLabel:   Finds input fields by their associated <label> text
  //                 Example: page.getByLabel('Email Address')
  //
  //   getByPlaceholder: Finds inputs by their placeholder text
  //                 Example: page.getByPlaceholder('Enter your email')
  //
  //   locator:      General CSS/XPath selector (fallback if others don't work)
  //                 Example: page.locator('#loginButton')
  // ==========================================================================

  // The email/username input field
  // Demo site (the-internet.herokuapp.com) uses a plain textbox with placeholder "Username"
  private get usernameInput() {
    return this.page.getByRole('textbox', { name: 'Username' });
  }

  // The password input field
  // Demo site uses a textbox with placeholder "Password"
  private get passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  // The Login submit button
  // Demo site has button text " Login" (with leading space), so we use a regex /login/i
  // to match it regardless of capitalisation or extra whitespace
  private get loginButton() {
    return this.page.getByRole('button', { name: /login/i });
  }

  // The flash/error message shown when login fails
  // Demo site uses a <div id="flash"> for all flash notifications (success AND error)
  // Example text for wrong password: "Your password is invalid!"
  private get errorMessage() {
    return this.page.locator('#flash');
  }

  // The "Forgot Password" link
  private get forgotPasswordLink() {
    return this.page.getByRole('link', { name: /forgot.*password/i });
  }

  // The heading shown ONLY after a successful login on the Secure Area page.
  // Demo site redirects to /secure and shows: <h2>Secure Area</h2>
  private get welcomeBanner() {
    return this.page.getByRole('heading', { name: 'Secure Area', level: 2 });
  }

  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  // "super(page)" calls the BasePage constructor, passing the page object up.
  // This sets up the "page" and "baseUrl" properties in BasePage.
  // ==========================================================================
  constructor(page: Page) {
    super(page);
  }

  // ==========================================================================
  // METHOD: navigateToLoginPage
  // ==========================================================================
  // PURPOSE:
  //   Opens the login page in the browser.
  //
  // USAGE IN TEST:
  //   const loginPage = new LoginPage(page);
  //   await loginPage.navigateToLoginPage();
  // ==========================================================================
  async navigateToLoginPage(): Promise<void> {
    logger.section('📂 Navigating to Login Page');

    // Navigate to /login — Playwright prepends BASE_URL from .env automatically
    await this.navigate('/login');

    // Dismiss any cookie consent banner that may appear on page load.
    // This prevents cookie popups from blocking the username/password fields.
    await this.dismissCookieBanner();

    // Confirm the page loaded by checking the Username field is visible
    await this.waitForElement(this.usernameInput, 'Username input field');
  }

  // ==========================================================================
  // METHOD: enterUsername
  // ==========================================================================
  // PURPOSE:
  //   Types the username (email) into the username field.
  //   Breaking this into its own method makes tests more readable.
  //
  // PARAMETERS:
  //   - username: The email/username string to type
  // ==========================================================================
  async enterUsername(username: string): Promise<void> {
    await this.fillInputField(this.usernameInput, username, 'Username/Email field');
  }

  // ==========================================================================
  // METHOD: enterPassword
  // ==========================================================================
  // PURPOSE:
  //   Types the password into the password field.
  //
  // PARAMETERS:
  //   - password: The password string to type
  // ==========================================================================
  async enterPassword(password: string): Promise<void> {
    await this.fillInputField(this.passwordInput, password, 'Password field');
  }

  // ==========================================================================
  // METHOD: clickLoginButton
  // ==========================================================================
  // PURPOSE:
  //   Clicks the login/sign-in button to submit the form.
  // ==========================================================================
  async clickLoginButton(): Promise<void> {
    await this.clickElement(this.loginButton, 'Login / Sign In button');
  }

  // ==========================================================================
  // METHOD: login (HIGH-LEVEL ACTION)
  // ==========================================================================
  // PURPOSE:
  //   Performs the COMPLETE login flow in one step.
  //   This is a "high-level" method that combines multiple low-level steps.
  //
  //   Instead of writing this in every test:
  //     await loginPage.enterUsername('user@test.com');
  //     await loginPage.enterPassword('password123');
  //     await loginPage.clickLoginButton();
  //
  //   You can just write:
  //     await loginPage.login('user@test.com', 'password123');
  //
  // PARAMETERS:
  //   - username: The login email/username
  //   - password: The login password
  // ==========================================================================
  async login(username: string, password: string): Promise<void> {
    logger.section(`🔐 Performing Login`);
    logger.info(`Logging in as: ${username}`);

    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();

    // Wait for the page to finish navigating after login
    await this.waitForPageLoad('domcontentloaded');

    logger.info('Login form submitted.');
  }

  // ==========================================================================
  // METHOD: verifySuccessfulLogin
  // ==========================================================================
  // PURPOSE:
  //   Asserts (verifies) that the login was SUCCESSFUL.
  //   Should be called AFTER login() to confirm the user got in.
  //
  //   If login failed (wrong credentials, server error, etc.), this
  //   assertion will FAIL the test with a clear message.
  // ==========================================================================
  async verifySuccessfulLogin(): Promise<void> {
    logger.step('Verifying successful login...');

    // After successful login, the welcome banner should be visible
    await this.assertElementVisible(this.welcomeBanner, 'Post-login welcome banner / dashboard header');

    logger.pass('Login verification successful — user is logged in!');
  }

  // ==========================================================================
  // METHOD: verifyLoginErrorMessage
  // ==========================================================================
  // PURPOSE:
  //   Asserts that a login error message IS visible and contains expected text.
  //   Used for NEGATIVE test cases (testing that bad credentials are rejected).
  //
  // PARAMETERS:
  //   - expectedMessage: Text that should appear in the error (e.g., "Invalid credentials")
  // ==========================================================================
  async verifyLoginErrorMessage(expectedMessage: string): Promise<void> {
    logger.step(`Verifying error message contains: "${expectedMessage}"`);

    await this.assertElementVisible(this.errorMessage, 'Login error message');
    await this.assertElementText(this.errorMessage, expectedMessage, 'Login error message text');

    logger.pass(`Error message verified: "${expectedMessage}"`);
  }

  // ==========================================================================
  // METHOD: getDisplayedErrorMessage
  // ==========================================================================
  // PURPOSE:
  //   Returns the text of the error message currently shown on the login page.
  //   Useful when you want to capture the exact error text for logging.
  //
  // RETURNS:
  //   The error message text, or empty string if no error is visible.
  // ==========================================================================
  async getDisplayedErrorMessage(): Promise<string> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 });
      return await this.errorMessage.textContent() || '';
    } catch {
      return ''; // No error message visible
    }
  }
}
