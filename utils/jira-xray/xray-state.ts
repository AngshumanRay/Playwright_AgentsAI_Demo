// =============================================================================
// utils/jira-xray/xray-state.ts — SHARED STATE STORE FOR XRAY INTEGRATION
// =============================================================================
// PURPOSE:
//   This file acts as a "memory" that stores XRAY data during the test run.
//   It holds the Test Execution ID and collects test results as tests finish.
//
// WHY DO WE NEED THIS?
//   Playwright runs tests across multiple files and processes. The global setup
//   creates the Test Execution (and gets an ID). Then each test (in possibly
//   different files) needs to save its result somewhere. After all tests finish,
//   the global teardown reads all results and sends them to XRAY.
//
//   This file is that "somewhere" — a shared store that all parts of the
//   test framework read from and write to.
//
// HOW THE DATA FLOWS:
//   [Global Setup] → Creates Test Execution → Saves executionKey here
//         ↓
//   [Each Test]    → Runs test → Saves result (PASS/FAIL) here
//         ↓
//   [Global Teardown] → Reads all results from here → Sends to XRAY
//
// NOTE ON FILE-BASED STATE:
//   Because Playwright can run tests in parallel (in separate Node.js processes),
//   we use a JSON file on disk as the shared state store. All processes can
//   read and write to the same file.
// =============================================================================

import * as fs   from 'fs';
import * as path from 'path';
import type { TestResultPayload } from './xray-result-updater';

// =============================================================================
// CONSTANTS
// =============================================================================

// The path where the shared state JSON file will be stored.
// "process.cwd()" returns the project root directory.
// We store it in a "test-results" folder which is ignored by Git.
const STATE_FILE_PATH = path.join(process.cwd(), 'test-results', 'xray-state.json');

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * The shape of the shared state object stored in the JSON file.
 */
export interface XrayState {
  // The Test Execution key created by global setup (e.g., "PROJ-789")
  // Will be empty string "" until setup creates the execution.
  executionKey: string;

  // The sprint number this run belongs to
  sprintNumber: string;

  // All test results collected so far (grows as tests complete)
  results: TestResultPayload[];

  // Timestamp when the test run started
  runStartedAt: string;
}

// =============================================================================
// FUNCTION: initializeXrayState
// =============================================================================
// PURPOSE:
//   Called by global setup to initialize the state file with execution details.
//   Clears any previous state and sets up fresh tracking for this test run.
//
// PARAMETERS:
//   - executionKey: The newly created Test Execution key
//   - sprintNumber: The sprint number for this run
// =============================================================================
export function initializeXrayState(executionKey: string, sprintNumber: string): void {
  console.log(`\n💾 [XrayState] Initializing state file for execution: ${executionKey}`);

  // Create the directory if it doesn't exist
  const stateDir = path.dirname(STATE_FILE_PATH);
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  // Write fresh initial state
  const initialState: XrayState = {
    executionKey,
    sprintNumber,
    results: [],
    runStartedAt: new Date().toISOString(),
  };

  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(initialState, null, 2), 'utf8');
  console.log(`✅ [XrayState] State file created at: ${STATE_FILE_PATH}`);
}

// =============================================================================
// FUNCTION: readXrayState
// =============================================================================
// PURPOSE:
//   Reads the current state from the JSON file.
//   Returns null if the state file doesn't exist yet.
// =============================================================================
export function readXrayState(): XrayState | null {
  if (!fs.existsSync(STATE_FILE_PATH)) {
    console.warn(`⚠️  [XrayState] State file not found. Did global setup run?`);
    return null;
  }

  try {
    const raw = fs.readFileSync(STATE_FILE_PATH, 'utf8');
    return JSON.parse(raw) as XrayState;
  } catch (error) {
    console.error(`❌ [XrayState] Failed to read state file:`, error);
    return null;
  }
}

// =============================================================================
// FUNCTION: appendTestResult
// =============================================================================
// PURPOSE:
//   Adds a single test result to the shared state file.
//   Called after each test completes (in the test's afterEach hook).
//
// PARAMETERS:
//   - result: The test result data to save
// =============================================================================
export function appendTestResult(result: TestResultPayload): void {
  const state = readXrayState();

  if (!state) {
    console.warn(`⚠️  [XrayState] Cannot append result — state not initialized.`);
    return;
  }

  // Add the new result to the array
  state.results.push(result);

  // Write back to disk
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');

  const statusEmoji = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${statusEmoji} [XrayState] Saved result: ${result.testCaseKey} → ${result.status}`);
}

// =============================================================================
// FUNCTION: clearXrayState
// =============================================================================
// PURPOSE:
//   Deletes the state file after the test run is complete.
//   Called at the very end of global teardown after all results are uploaded.
// =============================================================================
export function clearXrayState(): void {
  if (fs.existsSync(STATE_FILE_PATH)) {
    fs.unlinkSync(STATE_FILE_PATH);
    console.log(`🧹 [XrayState] State file cleared.`);
  }
}
