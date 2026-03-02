// =============================================================================
// utils/jira-xray/jira-auth.ts — JIRA API AUTHENTICATION UTILITY
// =============================================================================
// PURPOSE:
//   This file handles the "handshake" between our test framework and JIRA's API.
//
// WHAT IS AN API?
//   An API (Application Programming Interface) is a way for two computer programs
//   to talk to each other. JIRA has an API that lets us:
//     - Fetch test cases from JIRA (read data)
//     - Create test executions (write data)
//     - Update test results (write data)
//   Instead of a human clicking in JIRA, our code does it automatically.
//
// WHAT IS AUTHENTICATION?
//   Authentication means "proving who you are" to JIRA before it lets you in.
//   We use "Basic Authentication":
//     - Think of it like a username + password combination
//     - But instead of a regular password, we use a special "API Token"
//     - The username + token are combined and encoded into a single string
//     - This string is sent in every API request as an "Authorization header"
//
// WHAT IS AXIOS?
//   Axios is a popular JavaScript library for making HTTP requests.
//   An HTTP request is how web browsers (and our code) communicate with servers.
//   Example: When you open google.com, your browser makes an HTTP GET request.
//   We use axios to make HTTP requests to the JIRA API.
//
// WHAT IS A "PRE-CONFIGURED AXIOS INSTANCE"?
//   Instead of specifying the JIRA URL and credentials in every single request,
//   we create ONE axios instance with all settings pre-loaded.
//   Think of it as a "phone with JIRA's number already dialed" —
//   you just say what you want (the request), not how to connect.
// =============================================================================

// "axios" is the HTTP request library we use to call JIRA's API
import axios, { AxiosInstance, AxiosError } from 'axios';

// "config" contains all our environment variables (JIRA URL, credentials, etc.)
import { config } from '../../config/environment';

// =============================================================================
// FUNCTION: createJiraApiClient
// =============================================================================
// PURPOSE:
//   Creates and returns a fully configured axios HTTP client for JIRA API calls.
//   All subsequent JIRA/XRAY utilities use this client to make API requests.
//
// WHAT IT DOES STEP BY STEP:
//   1. Reads JIRA URL, username, and API token from the config (loaded from .env)
//   2. Encodes username + token into a Base64 string (required by JIRA Basic Auth)
//   3. Creates an axios instance with:
//      - JIRA's base URL (so we only need to specify the path in each request)
//      - Authentication header (so JIRA knows who we are)
//      - Content-Type header (so JIRA knows we're sending JSON data)
//   4. Attaches interceptors (automatic error handlers)
//   5. Returns the configured client
//
// RETURNS:
//   An AxiosInstance — a pre-configured HTTP client ready to call JIRA APIs.
//
// USAGE EXAMPLE (in another file):
//   import { createJiraApiClient } from './jira-auth';
//   const jiraClient = createJiraApiClient();
//   const response = await jiraClient.get('/rest/api/3/issue/PROJ-123');
// =============================================================================
export function createJiraApiClient(): AxiosInstance {

  // --------------------------------------------------------------------------
  // STEP 1: Read credentials from environment configuration
  // --------------------------------------------------------------------------
  const { baseUrl, username, apiToken } = config.jira;

  // --------------------------------------------------------------------------
  // STEP 2: Create the Basic Auth token
  // --------------------------------------------------------------------------
  // JIRA Basic Auth requires: Base64( "username:apiToken" )
  //
  // What is Base64?
  //   It's a way to encode binary/text data into a safe string of characters.
  //   Example: "john@test.com:mytoken123" → "am9obkB0ZXN0LmNvbTpteXRva2VuMTIz"
  //   JIRA requires this format in the "Authorization" HTTP header.
  //
  // "btoa()" is a built-in function that converts a string to Base64.
  // However, Node.js uses Buffer for this, which works with all characters.
  const base64Credentials = Buffer.from(`${username}:${apiToken}`).toString('base64');

  // The final Authorization header value looks like: "Basic am9obkB0ZXN0LmNvbTpteXRva2VuMTIz"
  const authHeader = `Basic ${base64Credentials}`;

  // --------------------------------------------------------------------------
  // STEP 3: Create the axios instance with pre-configured settings
  // --------------------------------------------------------------------------
  // "axios.create()" creates a new HTTP client with default settings.
  // Every request made with this client will automatically include:
  //   - baseURL: So we only write "/rest/api/3/..." instead of the full URL
  //   - headers: Authorization (who we are) + Content-Type (data format)
  //   - timeout: Stop waiting after 30 seconds (prevents infinite hangs)
  const jiraClient: AxiosInstance = axios.create({
    // The root URL for all JIRA API requests
    baseURL: baseUrl,

    // HTTP headers sent with EVERY request
    headers: {
      // Tell JIRA who we are (our encoded username + API token)
      'Authorization': authHeader,

      // Tell JIRA that we are sending and expecting JSON data
      // JSON (JavaScript Object Notation) is the standard data format for APIs
      'Content-Type': 'application/json',

      // Tell JIRA we want to receive JSON in the response
      'Accept': 'application/json',
    },

    // Maximum time to wait for a response (30 seconds = 30,000 milliseconds)
    // If JIRA doesn't respond within this time, the request will fail with a timeout error
    timeout: 30000,
  });

  // --------------------------------------------------------------------------
  // STEP 4: Add Request Interceptor (runs BEFORE every request is sent)
  // --------------------------------------------------------------------------
  // An "interceptor" is a function that automatically runs before/after every request.
  // This request interceptor logs what we're about to do — very helpful for debugging!
  jiraClient.interceptors.request.use(
    (requestConfig) => {
      // Log the HTTP method (GET/POST/PUT) and the URL being called
      console.log(`\n📡 [JIRA API] ${requestConfig.method?.toUpperCase()} → ${requestConfig.baseURL}${requestConfig.url}`);
      return requestConfig; // Must return the config to let the request proceed
    },
    (error: AxiosError) => {
      // If setting up the request itself fails, log and re-throw the error
      console.error(`❌ [JIRA API] Request setup failed:`, error.message);
      return Promise.reject(error);
    }
  );

  // --------------------------------------------------------------------------
  // STEP 5: Add Response Interceptor (runs AFTER every response is received)
  // --------------------------------------------------------------------------
  // This response interceptor:
  //   - On SUCCESS: Logs the HTTP status code and passes the response through
  //   - On FAILURE: Logs a detailed, human-readable error message and rethrows
  jiraClient.interceptors.response.use(
    (response) => {
      // Log the HTTP status code — 200 means OK, 201 means Created, etc.
      console.log(`✅ [JIRA API] Response received — Status: ${response.status}`);
      return response; // Pass the response through unchanged
    },
    (error: AxiosError) => {
      // Something went wrong. Let's explain what happened clearly.

      if (error.response) {
        // The server responded, but with an error status code (4xx or 5xx)
        // Common status codes:
        //   401 = Unauthorized  → Wrong username or API token
        //   403 = Forbidden     → You don't have permission
        //   404 = Not Found     → The URL or resource doesn't exist
        //   500 = Server Error  → JIRA had an internal problem
        const status = error.response.status;
        const statusText = error.response.statusText;
        const responseData = JSON.stringify(error.response.data, null, 2);

        console.error(
          `\n❌ [JIRA API] Request failed!\n` +
          `   Status: ${status} ${statusText}\n` +
          `   URL: ${error.config?.url}\n` +
          `   Response Body: ${responseData}\n`
        );

        // Provide specific guidance for common errors
        if (status === 401) {
          console.error(`   💡 TIP: Check your JIRA_USERNAME and JIRA_API_TOKEN in the .env file.`);
        } else if (status === 403) {
          console.error(`   💡 TIP: Your account may not have permission for this action in JIRA.`);
        } else if (status === 404) {
          console.error(`   💡 TIP: Check that the JIRA URL and resource ID are correct.`);
        }

      } else if (error.request) {
        // The request was sent but no response came back (network issue)
        console.error(
          `\n❌ [JIRA API] No response received — Network issue?\n` +
          `   💡 TIP: Check your JIRA_BASE_URL and internet connection.\n`
        );
      } else {
        // Something unexpected happened before the request was sent
        console.error(`\n❌ [JIRA API] Unexpected error: ${error.message}\n`);
      }

      // Re-throw the error so the calling code knows something went wrong
      return Promise.reject(error);
    }
  );

  // --------------------------------------------------------------------------
  // STEP 6: Return the fully configured client
  // --------------------------------------------------------------------------
  console.log(`🔐 [JIRA Auth] API client created for: ${baseUrl}`);
  return jiraClient;
}

// =============================================================================
// FUNCTION: testJiraConnection
// =============================================================================
// PURPOSE:
//   A simple "health check" function to verify that JIRA credentials work.
//   Call this during setup to catch authentication problems early.
//
// HOW IT WORKS:
//   It calls a lightweight JIRA API endpoint (/rest/api/3/myself) which
//   simply returns info about the currently logged-in user.
//   If this succeeds → credentials are valid.
//   If this fails → something is wrong with the URL or credentials.
//
// RETURNS:
//   true  → Connection successful
//   false → Connection failed (details logged to console)
// =============================================================================
export async function testJiraConnection(): Promise<boolean> {
  console.log('\n🔍 [JIRA Auth] Testing JIRA connection...');

  try {
    // Create a fresh client
    const client = createJiraApiClient();

    // Call the "who am I?" endpoint — the lightest possible JIRA API call
    const response = await client.get('/rest/api/3/myself');

    // If we get here, the connection worked!
    console.log(`✅ [JIRA Auth] Connected successfully as: ${response.data.displayName} (${response.data.emailAddress})`);
    return true;

  } catch {
    // The connection test failed
    console.error(`❌ [JIRA Auth] Could not connect to JIRA. Please check your .env credentials.`);
    return false;
  }
}
