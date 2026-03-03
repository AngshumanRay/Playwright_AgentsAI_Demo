// =============================================================================
// utils/jira-xray/xray-test-execution.ts — TEST EXECUTION MANAGEMENT UTILITY
// =============================================================================
// PURPOSE:
//   This file handles creating and managing a "Test Execution" in XRAY.
//
// IMPORTANT — MANUAL vs AUTOMATED BOUNDARY:
//   This is where the AUTOMATED part begins. Unlike Test Cases and Test Sets
//   (which QA creates manually in JIRA), Test Executions are created
//   AUTOMATICALLY by Playwright every time you run `npm test`.
//   You never need to create a Test Execution by hand in JIRA.
//
// WHAT IS A TEST EXECUTION?
//   A Test Execution is a JIRA ticket created by XRAY to record the results
//   of running a group of tests at a specific point in time.
//
//   Think of it like a REPORT CARD:
//     - The Test Set is the list of subjects (test cases) — created MANUALLY
//     - The Test Execution is the report card for ONE specific exam date — created AUTOMATICALLY
//     - Each test case in the execution gets a result: PASS, FAIL, or TODO
//
//   Example:
//     - Test Set "PROJ-456": Contains 10 test cases
//     - Test Execution "PROJ-789": "Sprint 5 Regression Run on 28-Feb-2026"
//       → PROJ-101: PASS
//       → PROJ-102: FAIL (screenshot attached)
//       → PROJ-103: TODO (not yet run)
//
// WHAT IS A SPRINT?
//   In Scrum (an Agile project methodology), a Sprint is a fixed time period
//   (usually 2 weeks) during which the team completes a set of work.
//   We name our Test Execution with the Sprint number so it's easy to find:
//   "Sprint 5 — Automated Test Run"
//
// WHAT DOES THIS FILE DO?
//   1. Creates a new Test Execution JIRA ticket for the current sprint
//   2. Links all test cases from the Test Set to this execution
//   3. Returns the Test Execution ID for use in result updates
// =============================================================================

import { createJiraApiClient } from './jira-auth';
import { config } from '../../config/environment';
import type { XrayTestCase } from './xray-test-set';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Represents the result of creating a new Test Execution in XRAY.
 * This is what gets returned after we call createTestExecution().
 */
export interface TestExecutionResult {
  // The JIRA key of the newly created Test Execution (e.g., "PROJ-789")
  executionKey: string;

  // The internal JIRA numeric ID of the Test Execution
  executionId: string;

  // The display name/summary of the Test Execution
  summary: string;

  // When the execution was created (ISO date string)
  createdAt: string;

  // Which sprint number this execution belongs to
  sprintNumber: string;
}

// =============================================================================
// FUNCTION: createTestExecution
// =============================================================================
// PURPOSE:
//   Creates a brand-new Test Execution in JIRA XRAY for the current sprint,
//   then links all the provided test cases to it.
//
// HOW IT WORKS:
//   1. Builds a descriptive name for the execution (e.g., "Sprint 5 — Automated Run")
//   2. Calls the XRAY REST API to create a new Test Execution JIRA ticket
//   3. Links each test case from our Test Set to this execution
//   4. Returns the execution details (especially the executionKey we'll need later)
//
// PARAMETERS:
//   - testCases:    Array of test cases to link to the execution
//   - sprintNumber: The sprint number (defaults to XRAY_SPRINT_NUMBER from .env)
//   - customSummary: Optional custom name for the execution
//
// RETURNS:
//   A TestExecutionResult object, or null if creation failed.
//
// USAGE EXAMPLE:
//   const execution = await createTestExecution(testSetResult.testCases);
//   console.log(execution?.executionKey); // "PROJ-789"
// =============================================================================
export async function createTestExecution(
  testCases: XrayTestCase[],
  sprintNumber: string = config.xray.sprintNumber,
  customSummary?: string
): Promise<TestExecutionResult | null> {

  console.log(`\n🚀 [XRAY] Creating Test Execution for Sprint ${sprintNumber}...`);

  try {
    const jiraClient = createJiraApiClient();

    // ------------------------------------------------------------------
    // STEP 1: Build the Test Execution summary (display name in JIRA)
    // ------------------------------------------------------------------
    // This is what the ticket will be named in JIRA.
    // Using today's date makes it easy to find later.
    const today = new Date().toISOString().split('T')[0]; // "2026-02-28"
    const executionSummary = customSummary
      || `Sprint ${sprintNumber} — Automated Playwright Test Run [${today}]`;

    console.log(`   📝 Creating execution: "${executionSummary}"`);

    // ------------------------------------------------------------------
    // STEP 2: Create the Test Execution ticket in JIRA via XRAY API
    // ------------------------------------------------------------------
    // XRAY Server endpoint: POST /rest/raven/1.0/api/testexecution
    //
    // We send a JSON body with:
    //   - fields.project.key: Which JIRA project to create the ticket in
    //   - fields.summary:     The name/title of the Test Execution ticket
    //   - fields.issuetype.name: Must be "Test Execution" (XRAY issue type)
    const createExecutionResponse = await jiraClient.post(
      '/rest/raven/1.0/api/testexecution',
      {
        fields: {
          // Which JIRA project this execution belongs to
          project: {
            key: config.xray.projectKey,
          },

          // The display name of the Test Execution in JIRA
          summary: executionSummary,

          // The JIRA issue type must be "Test Execution" for XRAY to recognize it
          issuetype: {
            name: 'Test Execution',
          },

          // A human-readable description of what this execution is for
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `Automated Playwright test run for Sprint ${sprintNumber}. ` +
                          `Executed on ${today} by the CI/CD pipeline. ` +
                          `${testCases.length} test case(s) included.`,
                  },
                ],
              },
            ],
          },
        },
      }
    );

    // Extract the key and ID of the newly created execution ticket
    const executionKey: string = createExecutionResponse.data.key;
    const executionId: string  = createExecutionResponse.data.id;

    console.log(`   ✅ Test Execution created: ${executionKey}`);

    // ------------------------------------------------------------------
    // STEP 3: Link test cases to the Test Execution
    // ------------------------------------------------------------------
    // Now we need to tell XRAY: "Hey, these test cases should be tracked
    // under this Test Execution."
    //
    // We send an array of test case issue keys to the XRAY API.
    // XRAY will add them to the execution with status "TODO" initially.
    if (testCases.length > 0) {
      console.log(`   📡 Linking ${testCases.length} test case(s) to the execution...`);

      const testCaseKeys = testCases.map((tc) => tc.issueKey);

      await jiraClient.post(
        `/rest/raven/1.0/api/testexecution/${executionKey}/test`,
        testCaseKeys
      );

      console.log(`   ✅ Linked test cases: ${testCaseKeys.join(', ')}`);
    }

    // ------------------------------------------------------------------
    // STEP 4: Return the execution result
    // ------------------------------------------------------------------
    const result: TestExecutionResult = {
      executionKey,
      executionId,
      summary:      executionSummary,
      createdAt:    new Date().toISOString(),
      sprintNumber,
    };

    console.log(
      `\n✅ [XRAY] Test Execution ready!\n` +
      `   Key: ${result.executionKey}\n` +
      `   Summary: "${result.summary}"\n` +
      `   Test Cases Linked: ${testCases.length}`
    );

    return result;

  } catch (error) {
    console.error(`\n❌ [XRAY] Failed to create Test Execution for Sprint ${sprintNumber}`);
    console.error(`   Error details:`, error);
    return null;
  }
}

// =============================================================================
// FUNCTION: getTestExecutionStatus
// =============================================================================
// PURPOSE:
//   Fetches the current status/progress of a Test Execution from XRAY.
//   Useful for checking "how many tests passed/failed so far?"
//
// PARAMETERS:
//   - executionKey: The Test Execution issue key (e.g., "PROJ-789")
//
// RETURNS:
//   An object with counts of passed, failed, and pending tests, or null on error.
// =============================================================================
export async function getTestExecutionStatus(executionKey: string): Promise<{
  total: number;
  passed: number;
  failed: number;
  pending: number;
} | null> {

  console.log(`\n🔍 [XRAY] Checking status of Test Execution: ${executionKey}...`);

  try {
    const jiraClient = createJiraApiClient();

    // Fetch all tests in this execution and their current statuses
    const response = await jiraClient.get(
      `/rest/raven/1.0/api/testexecution/${executionKey}/test`
    );

    const tests: Array<{ status: string }> = response.data || [];

    // Count tests by status
    // XRAY uses these status strings: "PASS", "FAIL", "TODO", "EXECUTING"
    const statusCounts = {
      total:   tests.length,
      passed:  tests.filter((t) => t.status === 'PASS').length,
      failed:  tests.filter((t) => t.status === 'FAIL').length,
      pending: tests.filter((t) => ['TODO', 'EXECUTING'].includes(t.status)).length,
    };

    console.log(
      `✅ [XRAY] Execution status:\n` +
      `   Total: ${statusCounts.total} | ` +
      `Passed: ${statusCounts.passed} | ` +
      `Failed: ${statusCounts.failed} | ` +
      `Pending: ${statusCounts.pending}`
    );

    return statusCounts;

  } catch (error) {
    console.error(`❌ [XRAY] Failed to get execution status for: ${executionKey}`, error);
    return null;
  }
}
