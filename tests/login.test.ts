// =============================================================================
// tests/login.test.ts — LOGIN FEATURE TEST SUITE
// =============================================================================
// PURPOSE:
//   This file contains automated tests for the Login feature of your application.
//
// WHAT IS A "TEST SUITE"?
//   A test suite is a collection of related tests grouped together.
//   All tests in this file are about the login functionality.
//
// HOW PLAYWRIGHT TESTS WORK:
//   - "test.describe()" groups related tests under a common name
//   - "test('test name', async ({ page }) => { ... })" is a single test
//   - "expect(...).toBe(...)" makes assertions (checks if something is true)
//   - If an assertion fails, the test fails immediately with a clear message
//
// HOW XRAY INTEGRATION WORKS HERE:
//   Instead of importing from "@playwright/test", we import from our custom
//   fixture file "xray-test-fixture". This gives us the same "test" function
//   PLUS automatic XRAY result reporting built in.
//
//   Each test has an annotation: { type: 'xray', description: 'PROJ-XXX' }
//   This links the test to a specific XRAY test case.
//   After the test runs, the result is automatically sent to XRAY.
//
// TEST STRUCTURE OVERVIEW:
//   ✅ TEST 1 (PROJ-101): Positive test — valid credentials → should log in
//   ❌ TEST 2 (PROJ-102): Negative test — wrong password → should show error
//   ❌ TEST 3 (PROJ-103): Negative test — empty fields → should show error
//
// HOW TO RUN THESE TESTS:
//   npm test                    → Run all tests
//   npm run test:login          → Run only login tests
//   npm run test:debug          → Run with browser visible (headed mode)
// =============================================================================

// =============================================================================
// IMPORT: Use our CUSTOM test function (not the default Playwright one)
// =============================================================================
// The custom "test" from xray-test-fixture provides:
//   - Everything from standard Playwright test (page, expect, etc.)
//   - xrayTestKey: The XRAY test case ID linked to this test
//   - Automatic result upload to XRAY after each test
import { test, expect } from './xray-test-fixture';

// Import the LoginPage object (our POM class for the login page)
import { LoginPage } from '../pages/LoginPage';

// Import enhanced logger — every step logged here appears in the HTML report
import { enhancedLogger } from '../utils/helpers/enhanced-logger';

// =============================================================================
// TEST CREDENTIALS
// =============================================================================
// These are the REAL login credentials for the demo site:
//   https://the-internet.herokuapp.com/login
//
// The demo site tells you the credentials on the page itself — so this is safe
// to hardcode for validation purposes.
// In a real project, store credentials in .env (never hardcode real passwords).
//
//   Valid username : tomsmith
//   Valid password : SuperSecretPassword!
//   Wrong password : anything else (e.g., WrongPassword)
// =============================================================================
const TEST_CREDENTIALS = {
  validUsername: 'tomsmith',
  validPassword: 'SuperSecretPassword!',
  wrongPassword: 'WrongPassword',
};

// =============================================================================
// TEST GROUP: Login Feature Tests
// =============================================================================
// "test.describe()" groups tests together. The name appears in test reports
// as a section header, making the report easy to read.
// =============================================================================
test.describe('Login Feature Tests', () => {

  // ============================================================================
  // TEST 1: Successful Login with Valid Credentials
  // ============================================================================
  // WHAT THIS TEST DOES:
  //   1. Opens the login page
  //   2. Enters correct username and password
  //   3. Clicks the Login button
  //   4. Verifies the user is redirected to the dashboard/home page
  //
  // XRAY MAPPING:
  //   annotation: { type: 'xray', description: 'PROJ-101' }
  //   → This test reports its result to XRAY test case PROJ-101
  //   → Change 'PROJ-101' to your actual XRAY test case key
  //
  // EXPECTED OUTCOME: PASS (user successfully logs in)
  // ============================================================================
  test(
    'TC01: Valid credentials should log the user in successfully',
    {
      // This annotation LINKS this Playwright test to the XRAY test case "PROJ-101"
      // When this test finishes, the result (PASS/FAIL) is sent to PROJ-101 in XRAY
      annotation: { type: 'xray', description: 'PROJ-101' },
    },
    async ({ page, xrayTestKey }) => {

      // Log which test we're running and its XRAY key
      enhancedLogger.section(`▶ Running Test: TC01 | XRAY: ${xrayTestKey}`);

      const loginPage = new LoginPage(page);

      // Step 1: Open the login page
      enhancedLogger.step('Step 1: Navigate to the login page', xrayTestKey);
      await loginPage.navigateToLoginPage();

      // Step 2: Perform login with valid credentials
      enhancedLogger.step('Step 2: Enter valid credentials and submit', xrayTestKey);
      await loginPage.login(TEST_CREDENTIALS.validUsername, TEST_CREDENTIALS.validPassword);

      // Step 3: Verify login was successful
      enhancedLogger.step('Step 3: Verify user is now on the Secure Area page', xrayTestKey);
      await loginPage.verifySuccessfulLogin();

      expect(loginPage.getCurrentUrl()).toContain('/secure');

      enhancedLogger.pass(`TC01 passed — User logged in successfully`, xrayTestKey);
    }
  );

  // ============================================================================
  // TEST 2: Login Should Fail with Wrong Password
  // ============================================================================
  // WHAT THIS TEST DOES:
  //   1. Opens the login page
  //   2. Enters CORRECT username but WRONG password
  //   3. Clicks Login
  //   4. Verifies an error message appears (not logged in)
  //
  // WHY TEST NEGATIVE SCENARIOS?
  //   A good test suite tests not only "happy paths" (things that should work)
  //   but also "unhappy paths" (things that should fail gracefully).
  //   Testing bad credentials ensures your app:
  //     - Doesn't log in unauthorized users
  //     - Shows a clear, helpful error message
  //
  // EXPECTED OUTCOME: PASS (the test verifies the ERROR was shown correctly)
  // ============================================================================
  test(
    'TC02: Wrong password should show an error message',
    {
      annotation: { type: 'xray', description: 'PROJ-102' },
    },
    async ({ page, xrayTestKey }) => {

      enhancedLogger.section(`▶ Running Test: TC02 | XRAY: ${xrayTestKey}`);

      const loginPage = new LoginPage(page);

      enhancedLogger.step('Step 1: Navigate to the login page', xrayTestKey);
      await loginPage.navigateToLoginPage();

      enhancedLogger.step('Step 2: Enter valid username but wrong password', xrayTestKey);
      await loginPage.login(TEST_CREDENTIALS.validUsername, TEST_CREDENTIALS.wrongPassword);

      enhancedLogger.step('Step 3: Verify error message is displayed', xrayTestKey);
      await loginPage.verifyLoginErrorMessage('Your password is invalid!');

      enhancedLogger.step('Step 4: Verify user is still on the login page', xrayTestKey);
      expect(loginPage.getCurrentUrl()).toContain('/login');

      enhancedLogger.pass(`TC02 passed — Error message shown for wrong password`, xrayTestKey);
    }
  );

  // ============================================================================
  // TEST 3: Login Should Fail with Empty Fields
  // ============================================================================
  // WHAT THIS TEST DOES:
  //   1. Opens the login page
  //   2. Clicks Login WITHOUT entering any credentials (empty fields)
  //   3. Verifies the form shows validation errors
  //
  // WHY TEST EMPTY FIELDS?
  //   This tests client-side validation — does the form prevent submission
  //   when required fields are empty? This is important for:
  //     - User experience (clear guidance on what's required)
  //     - Security (preventing blank/incomplete requests to the server)
  //
  // EXPECTED OUTCOME: PASS (validation errors are shown)
  // ============================================================================
  test(
    'TC03: Empty credentials should show validation errors',
    {
      annotation: { type: 'xray', description: 'PROJ-103' },
    },
    async ({ page, xrayTestKey }) => {

      enhancedLogger.section(`▶ Running Test: TC03 | XRAY: ${xrayTestKey}`);

      const loginPage = new LoginPage(page);

      enhancedLogger.step('Step 1: Navigate to the login page', xrayTestKey);
      await loginPage.navigateToLoginPage();

      enhancedLogger.step('Step 2: Click login button without entering credentials', xrayTestKey);
      await loginPage.clickLoginButton();

      enhancedLogger.step('Step 3: Verify validation flash message is shown', xrayTestKey);
      await loginPage.verifyLoginErrorMessage('Your username is invalid!');

      const currentUrl = loginPage.getCurrentUrl();
      expect(currentUrl).toContain('/login');

      enhancedLogger.info(`Validation confirmed: empty credentials rejected, URL is still: ${currentUrl}`, xrayTestKey);

      enhancedLogger.pass(`TC03 passed — Empty credentials correctly rejected`, xrayTestKey);
    }
  );

});
