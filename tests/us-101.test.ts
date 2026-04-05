// =============================================================================
// tests/us-101.test.ts — US-101: Login Functionality
// =============================================================================
// Auto-generated from: user-stories/US-101-login.yaml
// Data source: test-data/web-tests.yaml
// Implementation: Fully automated against https://the-internet.herokuapp.com
// =============================================================================

import { test, expect } from '../utils/framework/xray-test-fixture';
import { AuthenticationPage } from '../pages/AuthenticationPage';
import { enhancedLogger } from '../utils/helpers/enhanced-logger';
import { loadTestEntry } from '../utils/helpers/test-data-loader';

const DATA_FILE = 'web-tests.yaml';

test.describe('US-101: Login Functionality', () => {

  // ── US-101.AC-1: Successful login with valid credentials ──
  // Tags: Smoke, Regression
  // Given: The user is on the login page
  // When:  Enter valid username → Enter valid password → Click Login
  // Then:  Redirected to secure area AND success flash message displayed
  test('US-101.AC-1: Successful login with valid credentials',
    { annotation: { type: 'xray', description: 'US-101.AC-1' } },
    async ({ page, xrayTestKey }) => {
      const td = loadTestEntry(DATA_FILE, 'US-101.AC-1');
      if (!td.run) test.skip();

      enhancedLogger.section(`▶ Running: US-101.AC-1 | ${td.title}`);
      const loginPage = new AuthenticationPage(page);

      // Given: The user is on the login page
      await loginPage.goto(td.baseUrl as string, td.pagePath as string);

      // Step 1: The user enters a valid username
      enhancedLogger.step('Step 1: Enter valid username', xrayTestKey);
      await loginPage.enterUsername(td.username as string);

      // Step 2: The user enters a valid password
      enhancedLogger.step('Step 2: Enter valid password', xrayTestKey);
      await loginPage.enterPassword(td.password as string);

      // Step 3: The user clicks the Login button
      enhancedLogger.step('Step 3: Click Login button', xrayTestKey);
      await loginPage.clickLogin();

      // Then: The user is redirected to the secure area
      await expect(page).toHaveURL(new RegExp(td.expectedUrl as string));

      // Then: A success flash message is displayed
      const flash = await loginPage.getFlashMessage();
      expect(flash).toContain(td.expectedMessage as string);

      enhancedLogger.pass('US-101.AC-1 passed', xrayTestKey);
    }
  );

  // ── US-101.AC-2: Login fails with invalid password ──
  // Tags: Regression
  // Given: The user is on the login page
  // When:  Enter valid username → Enter invalid password → Click Login
  // Then:  Error flash displayed AND user remains on login page
  test('US-101.AC-2: Login fails with invalid password',
    { annotation: { type: 'xray', description: 'US-101.AC-2' } },
    async ({ page, xrayTestKey }) => {
      const td = loadTestEntry(DATA_FILE, 'US-101.AC-2');
      if (!td.run) test.skip();

      enhancedLogger.section(`▶ Running: US-101.AC-2 | ${td.title}`);
      const loginPage = new AuthenticationPage(page);

      // Given: The user is on the login page
      await loginPage.goto(td.baseUrl as string, td.pagePath as string);

      // Step 1: Enter valid username
      enhancedLogger.step('Step 1: Enter valid username', xrayTestKey);
      await loginPage.enterUsername(td.username as string);

      // Step 2: Enter invalid password
      enhancedLogger.step('Step 2: Enter invalid password', xrayTestKey);
      await loginPage.enterPassword(td.password as string);

      // Step 3: Click Login button
      enhancedLogger.step('Step 3: Click Login button', xrayTestKey);
      await loginPage.clickLogin();

      // Then: An error flash message is displayed
      const flash = await loginPage.getFlashMessage();
      expect(flash).toContain(td.expectedErrorMessage as string);

      // Then: The user remains on the login page
      await expect(page).toHaveURL(/\/login/);

      enhancedLogger.pass('US-101.AC-2 passed', xrayTestKey);
    }
  );

  // ── US-101.AC-3: Login fails with empty credentials ──
  // Tags: Sanity, Regression
  // Given: The user is on the login page
  // When:  Leave fields empty → Click Login
  // Then:  Error flash displayed AND user remains on login page
  test('US-101.AC-3: Login fails with empty credentials',
    { annotation: { type: 'xray', description: 'US-101.AC-3' } },
    async ({ page, xrayTestKey }) => {
      const td = loadTestEntry(DATA_FILE, 'US-101.AC-3');
      if (!td.run) test.skip();

      enhancedLogger.section(`▶ Running: US-101.AC-3 | ${td.title}`);
      const loginPage = new AuthenticationPage(page);

      // Given: The user is on the login page
      await loginPage.goto(td.baseUrl as string, td.pagePath as string);

      // Step 1: Leave username and password empty (fill with empty strings)
      enhancedLogger.step('Step 1: Leave username and password empty', xrayTestKey);
      await loginPage.enterUsername(td.username as string);
      await loginPage.enterPassword(td.password as string);

      // Step 2: Click Login button
      enhancedLogger.step('Step 2: Click Login button', xrayTestKey);
      await loginPage.clickLogin();

      // Then: An error flash message is displayed
      const flash = await loginPage.getFlashMessage();
      expect(flash).toContain(td.expectedErrorMessage as string);

      // Then: The user remains on the login page
      await expect(page).toHaveURL(/\/login/);

      enhancedLogger.pass('US-101.AC-3 passed', xrayTestKey);
    }
  );
});
