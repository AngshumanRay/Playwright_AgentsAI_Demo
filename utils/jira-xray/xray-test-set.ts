// =============================================================================
// utils/jira-xray/xray-test-set.ts — XRAY TEST SET RETRIEVAL UTILITY
// =============================================================================
// PURPOSE:
//   This file contains functions to fetch test cases from a JIRA XRAY Test Set.
//
// KEY CONCEPTS FOR BEGINNERS:
//
//   What is XRAY?
//     XRAY is a plugin (add-on) for JIRA that adds test management features.
//     It lets teams manage test cases, test sets, and test executions inside JIRA.
//
//   What is a Test Set?
//     A "Test Set" is like a folder/playlist in XRAY. It groups related test cases.
//     Example: "Login Feature Tests" might be a Test Set with 5 test cases.
//     Each Test Set has a JIRA ticket ID like "PROJ-456".
//
//   What is a Test Case?
//     A "Test Case" is a single test scenario. It has:
//       - An ID  (e.g., "PROJ-101")
//       - A name (e.g., "Verify user can log in with valid credentials")
//       - Steps  (what to do)
//       - Expected results (what should happen)
//
//   What is GraphQL?
//     GraphQL is a special way to ask an API for EXACTLY the data you want.
//     XRAY Cloud uses GraphQL. XRAY Server uses REST API.
//     Think of REST as asking for a whole pizza, GraphQL as asking for specific slices.
//
// WHAT THIS FILE DOES:
//   1. Connects to JIRA using the pre-built API client
//   2. Fetches all test cases inside a Test Set (by Test Set ID)
//   3. Parses the response and returns clean, structured test data
//   4. Provides helpers to find specific test cases by ID or name
// =============================================================================

import { createJiraApiClient } from './jira-auth';
import { config } from '../../config/environment';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================
// TypeScript "types" are like blueprints. They define the shape of data.
// Defining types helps catch mistakes — if you accidentally write wrong field
// names, TypeScript will warn you before you even run the code.

/**
 * Represents a single test STEP within a test case.
 * Each step describes one action the tester (or Playwright) should perform.
 */
export interface XrayTestStep {
  // Step number (e.g., 1, 2, 3...)
  stepNumber: number;

  // What to do in this step (e.g., "Enter username in the login field")
  action: string;

  // What data to use (e.g., "Username: admin, Password: secret123")
  testData: string;

  // What should happen after doing this step (e.g., "User is logged in")
  expectedResult: string;
}

/**
 * Represents a single test case fetched from XRAY.
 * This is the full details of one test that we need to automate and track.
 */
export interface XrayTestCase {
  // The JIRA issue key (e.g., "PROJ-101") — unique identifier for this test
  issueKey: string;

  // The full JIRA issue ID (internal numeric ID used in some API calls)
  issueId: string;

  // The test case name/summary (e.g., "Verify successful login")
  summary: string;

  // A longer description of what this test verifies (optional)
  description: string;

  // The ordered list of steps for this test case
  steps: XrayTestStep[];

  // Labels/tags applied to this test in JIRA (e.g., ["smoke", "regression"])
  labels: string[];

  // Test case status in JIRA (e.g., "To Do", "In Progress", "Done")
  status: string;
}

/**
 * Represents the result of fetching an entire Test Set from XRAY.
 */
export interface XrayTestSetResult {
  // The JIRA key of the Test Set itself (e.g., "PROJ-456")
  testSetKey: string;

  // The name/summary of the Test Set
  testSetSummary: string;

  // All test cases contained in this Test Set
  testCases: XrayTestCase[];

  // How many test cases were found
  totalCount: number;
}

// =============================================================================
// FUNCTION: fetchTestCasesFromTestSet
// =============================================================================
// PURPOSE:
//   Fetches all test cases from a specific XRAY Test Set using its JIRA issue key.
//
// HOW IT WORKS:
//   1. Calls JIRA REST API to get the Test Set issue details
//   2. Calls XRAY REST API to get the list of test cases in the set
//   3. For each test case, fetches its steps from JIRA
//   4. Returns everything as a clean, structured object
//
// PARAMETERS:
//   - testSetKey: The JIRA key of the Test Set (e.g., "PROJ-456")
//                 Defaults to the XRAY_TEST_SET_ID value from your .env file
//
// RETURNS:
//   An XrayTestSetResult object with all test case details, or null if it fails.
//
// USAGE EXAMPLE:
//   const testSet = await fetchTestCasesFromTestSet('PROJ-456');
//   console.log(testSet?.testCases[0].summary); // "Verify user can log in"
// =============================================================================
export async function fetchTestCasesFromTestSet(
  testSetKey: string = config.xray.testSetId
): Promise<XrayTestSetResult | null> {

  console.log(`\n📋 [XRAY] Fetching test cases from Test Set: ${testSetKey}...`);

  try {
    // Create the JIRA API client (with authentication pre-configured)
    const jiraClient = createJiraApiClient();

    // ------------------------------------------------------------------
    // STEP 1: Fetch the Test Set issue to get its name/summary
    // ------------------------------------------------------------------
    // We call the standard JIRA REST API to get information about the Test Set issue.
    // The URL format is: /rest/api/3/issue/{issueKey}
    // "fields=summary,description,labels,status" means "only give me these fields"
    // (Requesting fewer fields = faster response)
    console.log(`   📡 Fetching Test Set issue details...`);
    const testSetIssueResponse = await jiraClient.get(
      `/rest/api/3/issue/${testSetKey}?fields=summary,description,labels,status`
    );

    // Extract the fields from the response
    const testSetFields = testSetIssueResponse.data.fields;
    const testSetSummary: string = testSetFields.summary || 'No summary';

    console.log(`   ✅ Test Set found: "${testSetSummary}"`);

    // ------------------------------------------------------------------
    // STEP 2: Fetch the list of test cases in this Test Set via XRAY API
    // ------------------------------------------------------------------
    // XRAY Server/DC has a dedicated REST endpoint for getting tests in a Test Set.
    // URL: /rest/raven/1.0/api/testset/{issueKey}/test
    // This returns a list of test case issue keys associated with this test set.
    console.log(`   📡 Fetching test cases linked to the Test Set...`);
    const testCasesListResponse = await jiraClient.get(
      `/rest/raven/1.0/api/testset/${testSetKey}/test`
    );

    // The response is an array of test case objects like: [{ key: "PROJ-101" }, ...]
    const testCaseRefs: Array<{ key: string; id: string }> = testCasesListResponse.data || [];

    console.log(`   ✅ Found ${testCaseRefs.length} test case(s) in the Test Set.`);

    // ------------------------------------------------------------------
    // STEP 3: Fetch details for each test case
    // ------------------------------------------------------------------
    // For each test case key, we fetch its full details including steps.
    // "Promise.all()" runs all these fetches in PARALLEL (at the same time),
    // which is much faster than fetching them one by one.
    console.log(`   📡 Fetching detailed info for each test case...`);

    const testCasePromises = testCaseRefs.map((ref) =>
      fetchSingleTestCaseDetails(jiraClient, ref.key, ref.id)
    );

    // Wait for ALL test case fetches to complete
    const testCases = await Promise.all(testCasePromises);

    // Filter out any null results (in case a specific test case fetch failed)
    const validTestCases = testCases.filter((tc): tc is XrayTestCase => tc !== null);

    // ------------------------------------------------------------------
    // STEP 4: Return the complete Test Set result
    // ------------------------------------------------------------------
    const result: XrayTestSetResult = {
      testSetKey,
      testSetSummary,
      testCases: validTestCases,
      totalCount: validTestCases.length,
    };

    console.log(`\n✅ [XRAY] Successfully loaded ${result.totalCount} test case(s) from "${testSetSummary}"`);
    return result;

  } catch (error) {
    console.error(`\n❌ [XRAY] Failed to fetch test cases from Test Set: ${testSetKey}`);
    console.error(`   Error details:`, error);
    return null;
  }
}

// =============================================================================
// FUNCTION: fetchSingleTestCaseDetails (PRIVATE HELPER)
// =============================================================================
// PURPOSE:
//   Fetches the full details (summary, description, steps, labels, status) of
//   a single test case from JIRA XRAY using its issue key.
//
// This is a "private" helper — it's only used inside this file (not exported).
// The underscore prefix on "jiraClient" is just a convention indicating it's
// a passed-in dependency, not defined here.
//
// PARAMETERS:
//   - jiraClient: The pre-configured JIRA API client
//   - issueKey:   The test case issue key (e.g., "PROJ-101")
//   - issueId:    The internal numeric ID of the issue
//
// RETURNS:
//   An XrayTestCase object, or null if the fetch fails.
// =============================================================================
async function fetchSingleTestCaseDetails(
  jiraClient: ReturnType<typeof createJiraApiClient>,
  issueKey: string,
  issueId: string
): Promise<XrayTestCase | null> {

  try {
    // Fetch the JIRA issue fields (summary, description, labels, status)
    const issueResponse = await jiraClient.get(
      `/rest/api/3/issue/${issueKey}?fields=summary,description,labels,status`
    );
    const fields = issueResponse.data.fields;

    // Fetch the XRAY test steps for this test case
    // XRAY Server endpoint: /rest/raven/1.0/api/test/{issueKey}/step
    let steps: XrayTestStep[] = [];
    try {
      const stepsResponse = await jiraClient.get(
        `/rest/raven/1.0/api/test/${issueKey}/step`
      );

      // Map the raw XRAY step data into our clean XrayTestStep format
      steps = (stepsResponse.data || []).map((rawStep: Record<string, unknown>, index: number) => ({
        stepNumber: index + 1,
        action:         String((rawStep.step as Record<string, unknown>)?.raw        ?? rawStep.action        ?? ''),
        testData:       String((rawStep.data as Record<string, unknown>)?.raw        ?? rawStep.testData      ?? ''),
        expectedResult: String((rawStep.result as Record<string, unknown>)?.raw      ?? rawStep.expectedResult ?? ''),
      }));
    } catch {
      // Steps fetch failed — continue without steps (non-fatal)
      console.warn(`   ⚠️  Could not fetch steps for ${issueKey} — continuing without steps.`);
    }

    // Build and return the clean test case object
    return {
      issueKey,
      issueId,
      summary:     fields.summary     || 'No summary',
      description: fields.description || '',
      steps,
      labels:      (fields.labels     || []) as string[],
      status:      fields.status?.name || 'Unknown',
    };

  } catch (error) {
    console.error(`   ❌ Failed to fetch details for test case: ${issueKey}`, error);
    return null;
  }
}

// =============================================================================
// FUNCTION: findTestCaseById
// =============================================================================
// PURPOSE:
//   A simple helper to look up a specific test case from a fetched Test Set
//   using its JIRA issue key.
//
// PARAMETERS:
//   - testSetResult: The result object returned by fetchTestCasesFromTestSet()
//   - issueKey:      The issue key to look for (e.g., "PROJ-101")
//
// RETURNS:
//   The matching XrayTestCase, or undefined if not found.
//
// USAGE EXAMPLE:
//   const tc = findTestCaseById(testSetResult, 'PROJ-101');
//   if (tc) console.log(tc.summary);
// =============================================================================
export function findTestCaseById(
  testSetResult: XrayTestSetResult,
  issueKey: string
): XrayTestCase | undefined {
  return testSetResult.testCases.find((tc) => tc.issueKey === issueKey);
}
