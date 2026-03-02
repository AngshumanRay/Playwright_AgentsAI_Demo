// =============================================================================
// utils/email/email-verifier.ts — EMAIL VERIFICATION UTILITY
// =============================================================================
// PURPOSE:
//   Helps tests that involve email — e.g., "forgot password", "email OTP",
//   "signup confirmation". This utility can:
//     - Fetch emails from a test mailbox (e.g., Mailosaur, MailSlurp, Mailtrap)
//     - Extract verification codes/links from email bodies
//     - Wait for an expected email to arrive
//
// WHY IS EMAIL TESTING HARD?
//   When your app sends an email (e.g., "Reset Password" link), Playwright
//   can't open a real Gmail/Outlook inbox. Instead, we use a TEST mailbox
//   service that provides an API to read emails programmatically.
//
// SUPPORTED SERVICES (plug your choice):
//   - Mailosaur  (https://mailosaur.com)   — popular, reliable
//   - MailSlurp  (https://mailslurp.com)   — generous free tier
//   - Mailtrap   (https://mailtrap.io)     — great for staging
//   - Ethereal   (https://ethereal.email)  — free, disposable
//
// HOW TO ENABLE:
//   1. Set EMAIL_ENABLED=true in .env
//   2. Set EMAIL_SERVICE, EMAIL_API_KEY, EMAIL_SERVER_ID in .env
//   3. The framework checks isEmailConfigured() and skips gracefully if false
//
// WHEN IS THIS CALLED?
//   - Inside individual tests that involve email verification
//   - NOT in global-setup/teardown (email checks are per-test, not global)
// =============================================================================

import axios from 'axios';
import { config } from '../../config/environment';
import { logger } from '../helpers/logger';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Represents a test email fetched from the test mailbox.
 */
export interface TestEmail {
  id:       string;       // Unique email ID from the service
  from:     string;       // Sender address
  to:       string;       // Recipient address
  subject:  string;       // Email subject line
  body:     string;       // Full email body (HTML or text)
  receivedAt: string;     // When the email was received (ISO timestamp)
}

/**
 * Result of an email fetch/search operation.
 */
export interface EmailResult {
  success:  boolean;
  message:  string;
  email?:   TestEmail;     // The matching email, if found
  emails?:  TestEmail[];   // Multiple emails, if searching
}

// =============================================================================
// FUNCTION: isEmailConfigured
// =============================================================================
// PURPOSE:
//   Checks whether email testing is enabled and configured.
//   Returns false if disabled or has placeholder values.
// =============================================================================
export function isEmailConfigured(): boolean {
  return (
    config.email.enabled &&
    config.email.apiKey !== '' &&
    config.email.apiKey !== 'your-email-service-api-key'
  );
}

// =============================================================================
// FUNCTION: waitForEmail
// =============================================================================
// PURPOSE:
//   Waits for an email to arrive at a specific address with a matching subject.
//   Polls the email service every few seconds until the email appears or timeout.
//
// USE CASE:
//   Your test clicks "Forgot Password" → the app sends a reset email →
//   this function waits for that email → you extract the reset link from it.
//
// EXAMPLE:
//   const result = await waitForEmail('testuser@mailosaur.io', 'Reset your password', 30000);
//   if (result.success) {
//     const resetLink = extractLink(result.email.body, /reset-password/);
//     await page.goto(resetLink);
//   }
//
// PARAMETERS:
//   - recipientEmail: The email address to check for incoming mail
//   - subjectContains: Partial subject line to match (case-insensitive)
//   - timeoutMs: How long to wait before giving up (default: 30 seconds)
//   - pollIntervalMs: How often to check for new mail (default: 3 seconds)
// =============================================================================
export async function waitForEmail(
  recipientEmail:   string,
  subjectContains:  string,
  timeoutMs:        number = 30000,
  pollIntervalMs:   number = 3000
): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    logger.warn('Email service not configured. Skipping email check.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    logger.step(`Waiting for email to "${recipientEmail}" with subject containing "${subjectContains}"...`);

    const startTime = Date.now();

    // ─────────────────────────────────────────────────────────────────────
    // POLLING LOOP: Keep checking for the email until it arrives or timeout
    // ─────────────────────────────────────────────────────────────────────
    while (Date.now() - startTime < timeoutMs) {

      // 🔌 PLUG YOUR EMAIL SERVICE API HERE
      // ─────────────────────────────────────────────────────────────────────
      // Replace the placeholder below with your actual email service call.
      //
      // Mailosaur example:
      //   const response = await axios.get(
      //     `https://mailosaur.com/api/messages?server=${config.email.serverId}`,
      //     { headers: { Authorization: `Bearer ${config.email.apiKey}` } }
      //   );
      //   const emails = response.data.items;
      //   const match = emails.find(e =>
      //     e.to[0].email === recipientEmail &&
      //     e.subject.toLowerCase().includes(subjectContains.toLowerCase())
      //   );
      //
      // MailSlurp example:
      //   const response = await axios.get(
      //     `https://api.mailslurp.com/inboxes/${inboxId}/emails`,
      //     { headers: { 'x-api-key': config.email.apiKey } }
      //   );
      // ─────────────────────────────────────────────────────────────────────

      // PLACEHOLDER: Simulating no email found (replace with real API call above)
      // When you plug in your real email service, this variable will be populated
      // from the API response. For now it's null to demonstrate the polling loop.
      const matchingEmail: TestEmail | null = null as TestEmail | null;

      if (matchingEmail) {
        logger.pass(`Email received: "${matchingEmail.subject}"`);
        return { success: true, message: 'Email found', email: matchingEmail };
      }

      // Wait before polling again
      logger.info(`  No email yet. Retrying in ${pollIntervalMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    // Timeout reached — email never arrived
    logger.warn(`Timed out after ${timeoutMs / 1000}s waiting for email.`);
    return { success: false, message: `Timed out waiting for email to "${recipientEmail}"` };

  } catch (error: any) {
    logger.error(`Email fetch failed: ${error.message}`);
    return { success: false, message: error.message };
  }
}

// =============================================================================
// FUNCTION: extractVerificationCode
// =============================================================================
// PURPOSE:
//   Extracts a numeric verification code (e.g., OTP) from an email body.
//   Many apps send 4-8 digit codes via email for login or signup verification.
//
// EXAMPLE:
//   const code = extractVerificationCode(email.body, 6);
//   // Email body: "Your verification code is: 482901"
//   // Returns: "482901"
//
// PARAMETERS:
//   - emailBody: The full text/HTML of the email
//   - codeLength: The expected length of the code (default: 6)
// =============================================================================
export function extractVerificationCode(emailBody: string, codeLength: number = 6): string | null {
  // Build a regex to find a sequence of digits with the expected length
  // Examples:  \b\d{6}\b  → matches "482901" but not "12345" or "1234567"
  const regex = new RegExp(`\\b\\d{${codeLength}}\\b`);
  const match = emailBody.match(regex);
  if (match) {
    logger.info(`Extracted verification code: ${match[0]}`);
    return match[0];
  }
  logger.warn(`No ${codeLength}-digit code found in email body.`);
  return null;
}

// =============================================================================
// FUNCTION: extractLink
// =============================================================================
// PURPOSE:
//   Extracts a URL from an email body that matches a given pattern.
//   Useful for "Verify Email" or "Reset Password" links.
//
// EXAMPLE:
//   const link = extractLink(email.body, /reset-password/);
//   // Email body: "Click here: https://app.com/reset-password?token=abc123"
//   // Returns: "https://app.com/reset-password?token=abc123"
// =============================================================================
export function extractLink(emailBody: string, pattern: RegExp): string | null {
  // Find all URLs in the email body
  const urlRegex = /https?:\/\/[^\s"'<>]+/g;
  const allUrls  = emailBody.match(urlRegex) || [];

  // Find the one that matches the given pattern
  const match = allUrls.find((url) => pattern.test(url));

  if (match) {
    logger.info(`Extracted link: ${match}`);
    return match;
  }

  logger.warn(`No link matching pattern "${pattern}" found in email body.`);
  return null;
}
