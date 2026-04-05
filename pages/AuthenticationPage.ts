// =============================================================================
// pages/AuthenticationPage.ts — Page Object for Login Functionality
// =============================================================================
// Auto-generated from: user-stories/us-101-*.yaml
// Target: https://the-internet.herokuapp.com/login
// =============================================================================

import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuthenticationPage extends BasePage {

  // ─── Locators ──────────────────────────────────────────────────────────────
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly flashMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton   = page.locator('button[type="submit"]');
    this.flashMessage  = page.locator('#flash');
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  /** Navigate to the login page */
  async goto(baseUrl: string, pagePath: string): Promise<void> {
    await this.page.goto(`${baseUrl}${pagePath}`);
  }

  /** Fill username field */
  async enterUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  /** Fill password field */
  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /** Click the login button */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /** Full login flow */
  async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  /** Get the flash message text */
  async getFlashMessage(): Promise<string> {
    return (await this.flashMessage.textContent()) || '';
  }
}
