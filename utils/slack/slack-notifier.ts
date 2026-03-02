// =============================================================================
// utils/slack/slack-notifier.ts — SLACK NOTIFICATION UTILITY
// =============================================================================
// PURPOSE:
//   Sends test run summaries to a Slack channel via Incoming Webhook.
//
// WHAT IS A SLACK WEBHOOK?
//   A "Webhook" is a URL that accepts incoming data. Slack lets you create one
//   for any channel. When you POST a JSON message to that URL, it appears as
//   a message in the Slack channel. No user login required — just the URL.
//
// HOW TO SET IT UP:
//   1. In Slack, go to: https://api.slack.com/apps → Create New App
//   2. Choose "Incoming Webhooks" → Activate it
//   3. Click "Add New Webhook to Workspace" → pick a channel
//   4. Copy the Webhook URL → paste it into .env as SLACK_WEBHOOK_URL
//
// WHEN IS THIS CALLED?
//   - In global-teardown.ts AFTER all tests finish and XRAY results are uploaded
//   - Only if SLACK_WEBHOOK_URL is configured in .env (skipped otherwise)
//
// EXAMPLE SLACK MESSAGE:
//   ┌──────────────────────────────────────────────┐
//   │ 🧪 Playwright Test Run Complete              │
//   │ Environment: staging                         │
//   │ Sprint: 5                                    │
//   │ ✅ Passed: 8  ❌ Failed: 2  ⏳ Skipped: 0   │
//   │ XRAY Execution: PROJ-789                     │
//   │ Duration: 2m 15s                             │
//   └──────────────────────────────────────────────┘
// =============================================================================

import axios from 'axios';
import { config } from '../../config/environment';
import { logger } from '../helpers/logger';

// =============================================================================
// TYPE: Slack message payload
// =============================================================================
export interface SlackTestSummary {
  totalTests:     number;
  passed:         number;
  failed:         number;
  skipped:        number;
  durationMs:     number;
  executionKey?:  string;  // XRAY execution key (e.g., "PROJ-789")
  failedTests?:   string[]; // Names of failed tests for quick visibility
}

// =============================================================================
// FUNCTION: isSlackConfigured
// =============================================================================
// PURPOSE:
//   Checks whether Slack integration is active. Returns false if the webhook
//   URL is missing or set to a placeholder. This lets the framework skip
//   Slack gracefully when it's not needed.
// =============================================================================
export function isSlackConfigured(): boolean {
  const url = config.slack.webhookUrl;
  return (
    url !== '' &&
    url !== 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL' &&
    url.startsWith('https://hooks.slack.com/')
  );
}

// =============================================================================
// FUNCTION: sendSlackNotification
// =============================================================================
// PURPOSE:
//   Sends a formatted test summary message to the configured Slack channel.
//
// HOW IT WORKS:
//   1. Builds a rich Slack message using "Block Kit" formatting
//   2. POSTs the message to the Slack Webhook URL
//   3. Slack receives it and displays it in the channel
//
// PARAMETERS:
//   - summary: An object containing the test run results
//
// RETURNS:
//   true if the message was sent, false if it failed.
// =============================================================================
export async function sendSlackNotification(summary: SlackTestSummary): Promise<boolean> {
  if (!isSlackConfigured()) {
    logger.warn('Slack is not configured. Skipping notification.');
    return false;
  }

  try {
    logger.step('Sending Slack notification...');

    // Determine the overall status emoji and color
    const overallStatus = summary.failed > 0 ? '❌ FAILED' : '✅ ALL PASSED';
    const color         = summary.failed > 0 ? '#FF0000' : '#36a64f';

    // Format duration from milliseconds to human-readable (e.g., "2m 15s")
    const durationStr = formatDuration(summary.durationMs);

    // Build the Slack message payload
    // Slack uses a special JSON format for rich messages called "Block Kit"
    // But for simple messages, we can use "attachments" with fields
    const payload = {
      text: `🧪 Playwright Test Run: ${overallStatus}`,
      attachments: [
        {
          color,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text:
                  `*🧪 Playwright Test Run Complete*\n` +
                  `Environment: \`${config.app.environment}\`\n` +
                  `Sprint: \`${config.xray.sprintNumber}\`\n` +
                  `Duration: \`${durationStr}\``,
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Total Tests:*\n${summary.totalTests}` },
                { type: 'mrkdwn', text: `*✅ Passed:*\n${summary.passed}` },
                { type: 'mrkdwn', text: `*❌ Failed:*\n${summary.failed}` },
                { type: 'mrkdwn', text: `*⏳ Skipped:*\n${summary.skipped}` },
              ],
            },
          ],
        },
      ],
    };

    // Add XRAY execution link if available
    if (summary.executionKey && summary.executionKey !== 'NOT_CONFIGURED') {
      const jiraLink = `${config.jira.baseUrl}/browse/${summary.executionKey}`;
      payload.attachments[0].blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*XRAY Execution:* <${jiraLink}|${summary.executionKey}>`,
        },
        fields: undefined as any,
      });
    }

    // Add failed test names if any
    if (summary.failedTests && summary.failedTests.length > 0) {
      const failedList = summary.failedTests.map((t) => `• ${t}`).join('\n');
      payload.attachments[0].blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Failed Tests:*\n${failedList}`,
        },
        fields: undefined as any,
      });
    }

    // POST the message to Slack
    await axios.post(config.slack.webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000, // 10 second timeout
    });

    logger.pass('Slack notification sent successfully.');
    return true;

  } catch (error: any) {
    // Don't let Slack failures break the test run — just warn
    logger.warn(`Slack notification failed: ${error.message}`);
    logger.warn('This does not affect test results. Check SLACK_WEBHOOK_URL in .env.');
    return false;
  }
}

// =============================================================================
// HELPER: Format milliseconds into "Xm Ys" string
// =============================================================================
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
