// =============================================================================
// utils/helpers/logger.ts — LOGGING UTILITY
// =============================================================================
// PURPOSE:
//   A simple logging helper that prints formatted, color-coded messages.
//
// WHAT IS A LOGGER?
//   A logger is a tool that records events/messages during program execution.
//   Instead of writing "console.log(...)" everywhere with no structure,
//   a logger adds:
//     - Timestamps (when did this happen?)
//     - Log levels (INFO, WARN, ERROR, DEBUG)
//     - Consistent formatting (easy to read)
//
// LOG LEVELS (from least to most severe):
//   DEBUG: Detailed developer information (only shown when debugging)
//   INFO:  Normal operational messages ("Test started", "Page loaded")
//   WARN:  Something unexpected happened, but it's not fatal ("Element not found, retrying")
//   ERROR: Something went wrong that needs attention ("Test failed", "API call failed")
//
// COLOR CODES:
//   We use ANSI escape codes for terminal colors.
//   These are special character sequences that terminals interpret as colors.
//   Example: "\x1b[32m" means "switch to green color"
//            "\x1b[0m"  means "reset back to normal color"
// =============================================================================

// Terminal color codes using ANSI escape sequences
const Colors = {
  reset:   '\x1b[0m',
  bright:  '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',  // ✅ Success, INFO
  yellow:  '\x1b[33m',  // ⚠️  Warnings
  red:     '\x1b[31m',  // ❌ Errors
  cyan:    '\x1b[36m',  // 🔍 Debug info
  white:   '\x1b[37m',  // Regular text
  blue:    '\x1b[34m',  // 📋 Steps/actions
} as const;

// =============================================================================
// FUNCTION: formatTimestamp
// =============================================================================
// Returns the current time as a readable string: "2026-02-28 14:30:45"
// This tells us exactly WHEN each log line was printed.
// =============================================================================
function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
}

// =============================================================================
// THE LOGGER OBJECT
// =============================================================================
// Usage examples:
//   logger.info('Test started');
//   logger.warn('Slow network detected');
//   logger.error('Login failed', new Error('Wrong password'));
//   logger.step('Clicking the submit button');
// =============================================================================
export const logger = {

  // ---------------------------------------------------------------------------
  // INFO: Normal progress messages (green)
  // ---------------------------------------------------------------------------
  info(message: string): void {
    console.log(
      `${Colors.dim}[${formatTimestamp()}]${Colors.reset} ` +
      `${Colors.green}ℹ INFO${Colors.reset}  ${message}`
    );
  },

  // ---------------------------------------------------------------------------
  // WARN: Non-fatal warnings (yellow)
  // ---------------------------------------------------------------------------
  warn(message: string): void {
    console.warn(
      `${Colors.dim}[${formatTimestamp()}]${Colors.reset} ` +
      `${Colors.yellow}⚠ WARN${Colors.reset}  ${message}`
    );
  },

  // ---------------------------------------------------------------------------
  // ERROR: Something went wrong (red)
  // ---------------------------------------------------------------------------
  error(message: string, error?: unknown): void {
    console.error(
      `${Colors.dim}[${formatTimestamp()}]${Colors.reset} ` +
      `${Colors.red}✖ ERROR${Colors.reset} ${message}`
    );
    if (error) {
      // Print the error details with indentation for readability
      const errMsg = error instanceof Error ? error.stack || error.message : String(error);
      console.error(`${Colors.red}          ${errMsg}${Colors.reset}`);
    }
  },

  // ---------------------------------------------------------------------------
  // DEBUG: Detailed developer information (cyan)
  // Only shows when DEBUG=true or NODE_ENV=development
  // ---------------------------------------------------------------------------
  debug(message: string, data?: unknown): void {
    if (process.env['DEBUG'] !== 'true' && process.env['NODE_ENV'] !== 'development') return;
    console.log(
      `${Colors.dim}[${formatTimestamp()}]${Colors.reset} ` +
      `${Colors.cyan}🔍 DEBUG${Colors.reset} ${message}`
    );
    if (data) {
      console.log(`          ${JSON.stringify(data, null, 2)}`);
    }
  },

  // ---------------------------------------------------------------------------
  // STEP: A named action step in a test (blue)
  // Use this to narrate what the test is doing — makes logs easy to follow
  // ---------------------------------------------------------------------------
  step(stepName: string): void {
    console.log(
      `${Colors.dim}[${formatTimestamp()}]${Colors.reset} ` +
      `${Colors.blue}▶ STEP${Colors.reset}   ${stepName}`
    );
  },

  // ---------------------------------------------------------------------------
  // PASS: A test passed (bright green)
  // ---------------------------------------------------------------------------
  pass(testName: string): void {
    console.log(
      `${Colors.dim}[${formatTimestamp()}]${Colors.reset} ` +
      `${Colors.bright}${Colors.green}✅ PASS${Colors.reset}   ${testName}`
    );
  },

  // ---------------------------------------------------------------------------
  // FAIL: A test failed (bright red)
  // ---------------------------------------------------------------------------
  fail(testName: string, reason?: string): void {
    console.log(
      `${Colors.dim}[${formatTimestamp()}]${Colors.reset} ` +
      `${Colors.bright}${Colors.red}❌ FAIL${Colors.reset}   ${testName}${reason ? ` — ${reason}` : ''}`
    );
  },

  // ---------------------------------------------------------------------------
  // SECTION: A section header divider for readability
  // ---------------------------------------------------------------------------
  section(title: string): void {
    const line = '─'.repeat(60);
    console.log(`\n${Colors.bright}${line}${Colors.reset}`);
    console.log(`${Colors.bright}  ${title}${Colors.reset}`);
    console.log(`${Colors.bright}${line}${Colors.reset}\n`);
  },
};
