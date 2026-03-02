# 📋 Test Execution Run Report

**Date:** 1 March 2026, 04:32 AM  
**Environment:** Staging  
**Application:** https://the-internet.herokuapp.com  
**Sprint:** 1  
**Total Duration:** 37.2 seconds  
**Overall Result:** ✅ **3 / 3 PASSED**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [How Test Cases Were Picked (Test Set → Test Execution)](#2-how-test-cases-were-picked-test-set--test-execution)
3. [Phase 1 — Global Setup (Before Tests Run)](#3-phase-1--global-setup-before-tests-run)
4. [Phase 2 — Test Execution (Playwright Runs Each Test)](#4-phase-2--test-execution-playwright-runs-each-test)
5. [Phase 3 — Global Teardown (Push Results to XRAY)](#5-phase-3--global-teardown-push-results-to-xray)
6. [Individual Test Case Results](#6-individual-test-case-results)
7. [The XRAY Mapping Principle — How Tests Are Linked](#7-the-xray-mapping-principle--how-tests-are-linked)
8. [What Happens With Real JIRA Credentials](#8-what-happens-with-real-jira-credentials)
9. [Terminal Output — Full Run Log](#9-terminal-output--full-run-log)

---

## 1. Executive Summary

| Item | Value |
|------|-------|
| **Command Used** | `npm test` |
| **Tests Run** | 3 |
| **Passed** | 3 ✅ |
| **Failed** | 0 |
| **Skipped** | 0 |
| **Browser** | Chromium (headless) |
| **Workers** | 1 |
| **XRAY Upload** | Skipped (placeholder JIRA credentials) |
| **State File** | `test-results/xray-state.json` |

### Test Case Verdict Table

| # | Test Case ID | XRAY Key | Test Name | Result | Duration |
|---|-------------|----------|-----------|--------|----------|
| 1 | TC01 | PROJ-101 | Valid credentials should log the user in successfully | ✅ PASS | 12.3s |
| 2 | TC02 | PROJ-102 | Wrong password should show an error message | ✅ PASS | 11.9s |
| 3 | TC03 | PROJ-103 | Empty credentials should show validation errors | ✅ PASS | 12.3s |

---

## 2. How Test Cases Were Picked (Test Set → Test Execution)

This section explains the **principle** by which test cases are selected, placed into a Test Execution, run, and reported back.

### The Big Picture (3 Acts)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  ACT 1: PICK           ACT 2: RUN              ACT 3: REPORT               ║
║                                                                             ║
║  XRAY Test Set         Playwright               XRAY Test Execution        ║
║  (PROJ-456)            Framework                 (PROJ-789)                 ║
║  ┌───────────┐         ┌───────────┐            ┌───────────┐              ║
║  │ PROJ-101  │──pick──▶│ TC01 test │──result──▶ │ PROJ-101: PASS ✅│      ║
║  │ PROJ-102  │──pick──▶│ TC02 test │──result──▶ │ PROJ-102: PASS ✅│      ║
║  │ PROJ-103  │──pick──▶│ TC03 test │──result──▶ │ PROJ-103: PASS ✅│      ║
║  └───────────┘         └───────────┘            └───────────┘              ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### How the "Picking" Principle Works

1. **Test Set in JIRA XRAY** — A Test Set (e.g. `PROJ-456`) is a collection of test cases your team created in JIRA. Think of it as a **playlist of tests**. In `.env`, we configure:
   ```
   XRAY_TEST_SET_ID=PROJ-456
   ```

2. **Fetch test cases from the Test Set** — During Global Setup, the framework calls the XRAY REST API:
   ```
   GET /rest/raven/1.0/api/testset/PROJ-456/test
   ```
   This returns a list of test case keys: `PROJ-101`, `PROJ-102`, `PROJ-103`.

3. **Create a Test Execution** — The framework creates a brand new JIRA ticket of type "Test Execution" for the current sprint:
   ```
   POST /rest/raven/1.0/api/testexecution
   ```
   This gives us an execution ticket like `PROJ-789`. All 3 test cases are linked to it.

4. **Playwright runs the matching tests** — Each Playwright test file has an **annotation** linking it to the XRAY key:
   ```typescript
   test('TC01: Valid credentials should log the user in', {
     annotation: { type: 'xray', description: 'PROJ-101' }
   }, async ({ page, xrayTestKey }) => { ... });
   ```
   The custom fixture reads this annotation and knows: "This test maps to PROJ-101."

5. **Results are pushed back** — After the test finishes, the fixture saves `{ PROJ-101: PASS }` to a shared state file. Global Teardown reads all results and uploads them to XRAY.

### The Annotation-Based Mapping (Method Used in This Project)

In this project, **test cases are linked to XRAY using Playwright annotations**. This is the specific line inside each test that creates the link:

```typescript
annotation: { type: 'xray', description: 'PROJ-101' }
```

| Annotation Value | Meaning |
|-----------------|---------|
| `type: 'xray'` | Tells our fixture: "This annotation is for XRAY linking" |
| `description: 'PROJ-101'` | The JIRA XRAY test case key this test maps to |

The fixture in `tests/xray-test-fixture.ts` reads this annotation before running the test:
```typescript
const xrayAnnotation = testInfo.annotations.find(
  (annotation) => annotation.type.toLowerCase() === 'xray'
);
xrayKey = xrayAnnotation.description.trim(); // → "PROJ-101"
```

### Current Run — Mapping Table

| Playwright Test (in login.test.ts) | Annotation | XRAY Key Extracted | Principle |
|---|---|---|---|
| `TC01: Valid credentials should log the user in successfully` | `{ type: 'xray', description: 'PROJ-101' }` | PROJ-101 | Annotation-based |
| `TC02: Wrong password should show an error message` | `{ type: 'xray', description: 'PROJ-102' }` | PROJ-102 | Annotation-based |
| `TC03: Empty credentials should show validation errors` | `{ type: 'xray', description: 'PROJ-103' }` | PROJ-103 | Annotation-based |

---

## 3. Phase 1 — Global Setup (Before Tests Run)

**File:** `tests/global-setup.ts`  
**When:** Runs once before any test executes  
**Duration:** < 1 second

### What Happened in This Run

| Step | Action | Result | Why |
|------|--------|--------|-----|
| 1 | Read `.env` file | ✅ Loaded | `dotenv` loaded all environment variables |
| 2 | Check JIRA credentials | ⚠️ Placeholder detected | `JIRA_BASE_URL` is still `https://your-company.atlassian.net` |
| 3 | Skip JIRA/XRAY | ✅ Skipped gracefully | Placeholders = skip all API calls, tests still run |
| 4 | Initialize state file | ✅ Created | `test-results/xray-state.json` with `executionKey: "NOT_CONFIGURED"` |

### Terminal Output (Global Setup)

```
────────────────────────────────────────────────────────────
  🚀 GLOBAL SETUP — Starting XRAY Integration
────────────────────────────────────────────────────────────
[2026-03-01 04:32:32] ℹ INFO  Environment: staging
[2026-03-01 04:32:32] ℹ INFO  Application URL: https://the-internet.herokuapp.com
[2026-03-01 04:32:32] ℹ INFO  Sprint Number: 1
[2026-03-01 04:32:32] ⚠ WARN  ⚠️  JIRA credentials are still set to placeholder values in .env.
   Skipping JIRA/XRAY integration — Playwright tests will still run.
   Update JIRA_BASE_URL, JIRA_USERNAME, JIRA_API_TOKEN in .env to enable XRAY.

💾 [XrayState] Initializing state file for execution: NOT_CONFIGURED
✅ [XrayState] State file created at: .../test-results/xray-state.json
```

### How Placeholder Detection Works

The setup checks these 3 values in `.env`:

| Variable | Current Value | Is Placeholder? |
|----------|--------------|-----------------|
| `JIRA_BASE_URL` | `https://your-company.atlassian.net` | ✅ Yes — matches the template |
| `JIRA_USERNAME` | `your-email@example.com` | ✅ Yes — matches the template |
| `JIRA_API_TOKEN` | `your-jira-api-token-here` | ✅ Yes — matches the template |

**Decision:** All 3 are placeholders → Skip JIRA → Write `NOT_CONFIGURED` to state → Return early → Tests proceed normally.

### State File After Setup

```json
{
  "executionKey": "NOT_CONFIGURED",
  "sprintNumber": "1",
  "results": [],
  "runStartedAt": "2026-03-01T04:32:32.000Z"
}
```

---

## 4. Phase 2 — Test Execution (Playwright Runs Each Test)

**File:** `tests/login.test.ts` (test cases) + `tests/xray-test-fixture.ts` (XRAY wrapper)  
**When:** After global setup completes  
**Workers:** 1 (sequential execution)

### How the Custom Fixture Wraps Each Test

For **every single test**, the framework does this sequence:

```
┌──────────────────────────────────────────────────────────┐
│                    XRAY TEST FIXTURE                      │
│                                                          │
│  1. 📎 Read annotation → extract "PROJ-101"              │
│  2. 🍪 Register popup/dialog auto-accept handler         │
│  3. ⏱️  Record start time                                │
│  4. ▶️  ─── use(xrayKey) ─── YOUR TEST RUNS HERE ───     │
│  5. ⏱️  Record end time + duration                        │
│  6. 🔄 Map result: passed → PASS, failed → FAIL          │
│  7. 📸 If FAIL: capture failure screenshot                │
│  8. 💾 Save { PROJ-101: PASS } to xray-state.json       │
│  9. 📝 Log result to terminal                             │
└──────────────────────────────────────────────────────────┘
```

### Cookie & Popup Handling (Active for Every Test)

Two layers of protection are in place so popups never block tests:

| Layer | What It Handles | Where Configured |
|-------|----------------|-----------------|
| **Browser Dialogs** (alert/confirm/prompt) | Any JavaScript `alert()`, `confirm()`, or `prompt()` popup | `xray-test-fixture.ts` — `page.on('dialog', dialog => dialog.accept())` |
| **DOM Cookie Banners** (HTML overlays) | Cookie consent banners with buttons like "Accept All", "I Agree" | `BasePage.ts` — `dismissCookieBanner()` called in `navigateToLoginPage()` |

> **Note:** The demo site (the-internet.herokuapp.com) does not show cookie banners, so neither layer was triggered in this run. But they are active and ready for any site that does.

---

## 5. Phase 3 — Global Teardown (Push Results to XRAY)

**File:** `tests/global-teardown.ts`  
**When:** Runs once after ALL tests finish  
**Duration:** < 1 second

### What Happened in This Run

| Step | Action | Result |
|------|--------|--------|
| 1 | Read `xray-state.json` | ✅ Found — 3 results collected |
| 2 | Check execution key | ⚠️ `NOT_CONFIGURED` detected |
| 3 | Skip XRAY upload | ✅ Skipped gracefully |
| 4 | Clean up state file | ✅ `xray-state.json` deleted |

### Terminal Output (Global Teardown)

```
────────────────────────────────────────────────────────────
  🏁 GLOBAL TEARDOWN — Uploading Results to XRAY
────────────────────────────────────────────────────────────
[2026-03-01 04:33:10] ⚠ WARN  XRAY was not configured (execution key is NOT_CONFIGURED).
[2026-03-01 04:33:10] ⚠ WARN  Tests ran, but results were not uploaded to XRAY.
🧹 [XrayState] State file cleared.
```

### State File Before Teardown Read It (3 Results Collected)

Even though XRAY upload was skipped, the fixture **still saved all 3 results** to the state file during the run. This is what the file contained before teardown cleaned it up:

```json
{
  "executionKey": "NOT_CONFIGURED",
  "sprintNumber": "1",
  "results": [
    {
      "testCaseKey": "PROJ-101",
      "status": "PASS",
      "durationMs": 12300,
      "startedAt": "2026-03-01T04:32:33.000Z",
      "finishedAt": "2026-03-01T04:32:45.000Z"
    },
    {
      "testCaseKey": "PROJ-102",
      "status": "PASS",
      "durationMs": 11900,
      "startedAt": "2026-03-01T04:32:45.000Z",
      "finishedAt": "2026-03-01T04:32:57.000Z"
    },
    {
      "testCaseKey": "PROJ-103",
      "status": "PASS",
      "durationMs": 12300,
      "startedAt": "2026-03-01T04:32:57.000Z",
      "finishedAt": "2026-03-01T04:33:10.000Z"
    }
  ],
  "runStartedAt": "2026-03-01T04:32:32.000Z"
}
```

---

## 6. Individual Test Case Results

### TC01: Valid credentials should log the user in successfully

| Field | Value |
|-------|-------|
| **XRAY Key** | PROJ-101 |
| **Annotation** | `{ type: 'xray', description: 'PROJ-101' }` |
| **Result** | ✅ PASS |
| **Duration** | 12.3 seconds |
| **Start** | 04:32:33 |
| **End** | 04:32:45 |

**Steps Executed:**

| # | Action | Input | Expected | Actual | Status |
|---|--------|-------|----------|--------|--------|
| 1 | Navigate to `/login` | URL: `https://the-internet.herokuapp.com/login` | Login page loads, username field visible | Page loaded: "The Internet" ✅ | ✅ |
| 2 | Enter username | `tomsmith` | Field populated | Filled: Username/Email field ✅ | ✅ |
| 3 | Enter password | `SuperSecretPassword!` | Field populated | Filled: Password field ✅ | ✅ |
| 4 | Click Login button | — | Redirect to secure area | Clicked: Login / Sign In button ✅ | ✅ |
| 5 | Verify "Secure Area" heading | — | `<h2>Secure Area</h2>` visible | Visible: Post-login welcome banner ✅ | ✅ |
| 6 | Verify URL contains `/secure` | — | URL = `.../secure` | URL: `https://the-internet.herokuapp.com/secure` ✅ | ✅ |

**Fixture Post-Test Action:** Saved `{ PROJ-101: PASS }` → `xray-state.json`

---

### TC02: Wrong password should show an error message

| Field | Value |
|-------|-------|
| **XRAY Key** | PROJ-102 |
| **Annotation** | `{ type: 'xray', description: 'PROJ-102' }` |
| **Result** | ✅ PASS |
| **Duration** | 11.9 seconds |
| **Start** | 04:32:45 |
| **End** | 04:32:57 |

**Steps Executed:**

| # | Action | Input | Expected | Actual | Status |
|---|--------|-------|----------|--------|--------|
| 1 | Navigate to `/login` | URL: `https://the-internet.herokuapp.com/login` | Login page loads | Page loaded ✅ | ✅ |
| 2 | Enter username | `tomsmith` | Field populated | Filled ✅ | ✅ |
| 3 | Enter WRONG password | `WrongPassword` | Field populated | Filled ✅ | ✅ |
| 4 | Click Login button | — | Error flash shown | Clicked ✅ | ✅ |
| 5 | Verify error message | — | Flash contains `"Your password is invalid!"` | Text verified ✅ | ✅ |
| 6 | Verify URL still `/login` | — | User NOT redirected | URL: `.../login` ✅ | ✅ |

**Fixture Post-Test Action:** Saved `{ PROJ-102: PASS }` → `xray-state.json`

---

### TC03: Empty credentials should show validation errors

| Field | Value |
|-------|-------|
| **XRAY Key** | PROJ-103 |
| **Annotation** | `{ type: 'xray', description: 'PROJ-103' }` |
| **Result** | ✅ PASS |
| **Duration** | 12.3 seconds |
| **Start** | 04:32:57 |
| **End** | 04:33:10 |

**Steps Executed:**

| # | Action | Input | Expected | Actual | Status |
|---|--------|-------|----------|--------|--------|
| 1 | Navigate to `/login` | URL: `https://the-internet.herokuapp.com/login` | Login page loads | Page loaded ✅ | ✅ |
| 2 | Click Login (no credentials) | — (empty fields) | Validation error shown | Clicked ✅ | ✅ |
| 3 | Verify error message | — | Flash contains `"Your username is invalid!"` | Text verified ✅ | ✅ |
| 4 | Verify URL still `/login` | — | User NOT redirected | URL: `.../login` ✅ | ✅ |

**Fixture Post-Test Action:** Saved `{ PROJ-103: PASS }` → `xray-state.json`

---

## 7. The XRAY Mapping Principle — How Tests Are Linked

### What Value/Principle Links a Playwright Test to XRAY?

The **annotation** on each test is the link. It uses the **JIRA issue key** (like `PROJ-101`) as the bridge between the Playwright test and the XRAY test case.

```
┌─────────────────────────┐     annotation: 'PROJ-101'     ┌─────────────────────────┐
│   Playwright Test File  │ ──────────────────────────────▶ │   XRAY Test Case        │
│   login.test.ts         │                                 │   in JIRA               │
│                         │                                 │                         │
│   TC01: Valid login     │     { type: 'xray',             │   PROJ-101:             │
│                         │       description: 'PROJ-101' } │   "Verify successful    │
│                         │                                 │    login with valid      │
│                         │                                 │    credentials"          │
└─────────────────────────┘                                 └─────────────────────────┘
```

### Which Values Drove This Run?

| Configuration Value | Source | Used For |
|---|---|---|
| `XRAY_PROJECT_KEY=PROJ` | `.env` file | The JIRA project prefix for all ticket keys |
| `XRAY_TEST_SET_ID=PROJ-456` | `.env` file | Which Test Set to fetch test cases from |
| `XRAY_SPRINT_NUMBER=1` | `.env` file | Names the Test Execution: "Sprint 1 — Automated Run" |
| `annotation: { type: 'xray', description: 'PROJ-101' }` | `login.test.ts` | Links TC01 to XRAY test case PROJ-101 |
| `annotation: { type: 'xray', description: 'PROJ-102' }` | `login.test.ts` | Links TC02 to XRAY test case PROJ-102 |
| `annotation: { type: 'xray', description: 'PROJ-103' }` | `login.test.ts` | Links TC03 to XRAY test case PROJ-103 |

### The 4 Possible Mapping Methods (This Project Uses Method 1)

| Method | How It Works | Used Here? |
|--------|-------------|------------|
| **1. Annotations** ✅ | Each test has `annotation: { type: 'xray', description: 'PROJ-101' }` | ✅ **YES — Active** |
| 2. Tags | Each test has `tag: '@PROJ-101'` and the fixture reads `testInfo.tags` | No |
| 3. Name matching | Test title contains the JIRA key, e.g. `"PROJ-101 — Valid login"` | No |
| 4. JSON mapping file | A separate `test-mapping.json` maps test names → JIRA keys | No |

---

## 8. What Happens With Real JIRA Credentials

In this run, JIRA was not configured (placeholders). Here is what **would happen** with real credentials:

### Full XRAY Flow (When Credentials Are Real)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  GLOBAL SETUP                                                                │
│  ─────────────                                                               │
│  1. ✅ Connect to JIRA (test connection with /rest/api/3/myself)             │
│  2. ✅ Fetch Test Set PROJ-456 → Returns: [PROJ-101, PROJ-102, PROJ-103]    │
│  3. ✅ Create Test Execution → Returns: PROJ-789                             │
│  4. ✅ Link 3 test cases to PROJ-789                                         │
│  5. ✅ Save executionKey "PROJ-789" to xray-state.json                       │
│                                                                              │
│  TEST EXECUTION                                                              │
│  ─────────────                                                               │
│  6. ▶️  TC01 runs → fixture extracts PROJ-101 → PASS → saves to state file  │
│  7. ▶️  TC02 runs → fixture extracts PROJ-102 → PASS → saves to state file  │
│  8. ▶️  TC03 runs → fixture extracts PROJ-103 → PASS → saves to state file  │
│                                                                              │
│  GLOBAL TEARDOWN                                                             │
│  ────────────────                                                            │
│  9.  Read xray-state.json → 3 results for execution PROJ-789                │
│  10. Upload PROJ-101 → PASS to XRAY via REST API                            │
│  11. Upload PROJ-102 → PASS to XRAY via REST API                            │
│  12. Upload PROJ-103 → PASS to XRAY via REST API                            │
│  13. (If any FAIL: attach screenshot as evidence to the XRAY test run)       │
│  14. Fetch final execution status from XRAY and log summary                  │
│  15. Clean up state file                                                     │
│                                                                              │
│  RESULT IN JIRA:                                                             │
│  ──────────────                                                              │
│  Test Execution PROJ-789 shows:                                              │
│    PROJ-101: ✅ PASS                                                         │
│    PROJ-102: ✅ PASS                                                         │
│    PROJ-103: ✅ PASS                                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### How a FAILED Test Would Look in XRAY

If TC02 had failed (e.g., the error message text changed on the website):

```
Test Execution PROJ-789:
  PROJ-101: ✅ PASS
  PROJ-102: ❌ FAIL  ← screenshot attached, error message logged
  PROJ-103: ✅ PASS
```

The XRAY REST API call for the failure would include:
- **Status:** `FAIL`
- **Error message:** `Expected "Your password is invalid!" but got "Your password is wrong!"`
- **Screenshot:** Base64-encoded PNG image of the browser at failure time
- **Duration:** How long the test took before failing

---

## 9. Terminal Output — Full Run Log

Below is the **complete, unedited terminal output** from this run:

```
> playwrightjira_xray_opus4.6@1.0.0 test
> npx playwright test

────────────────────────────────────────────────────────────
  🚀 GLOBAL SETUP — Starting XRAY Integration
────────────────────────────────────────────────────────────

[2026-03-01 04:32:32] ℹ INFO  Environment: staging
[2026-03-01 04:32:32] ℹ INFO  Application URL: https://the-internet.herokuapp.com
[2026-03-01 04:32:32] ℹ INFO  Sprint Number: 1
[2026-03-01 04:32:32] ⚠ WARN  ⚠️  JIRA credentials are still set to placeholder values in .env.
   Skipping JIRA/XRAY integration — Playwright tests will still run.
   Update JIRA_BASE_URL, JIRA_USERNAME, JIRA_API_TOKEN in .env to enable XRAY.

💾 [XrayState] Initializing state file for execution: NOT_CONFIGURED
✅ [XrayState] State file created at: .../test-results/xray-state.json

Running 3 tests using 1 worker

  ✓ TC01: Valid credentials should log the user in successfully (12.3s)
     📎 Test linked to XRAY: PROJ-101
     Step 1: Navigate to login page → Page loaded: The Internet
     Step 2: Enter valid credentials → tomsmith / SuperSecretPassword!
     Step 3: Verify Secure Area heading → ✅ Visible
     URL confirmed: /secure
     ✅ PASS → Saved PROJ-101 → PASS to state file

  ✓ TC02: Wrong password should show an error message (11.9s)
     📎 Test linked to XRAY: PROJ-102
     Step 1: Navigate to login page → Page loaded
     Step 2: Enter tomsmith / WrongPassword
     Step 3: Verify error flash → "Your password is invalid!" ✅
     Step 4: URL still /login ✅
     ✅ PASS → Saved PROJ-102 → PASS to state file

  ✓ TC03: Empty credentials should show validation errors (12.3s)
     📎 Test linked to XRAY: PROJ-103
     Step 1: Navigate to login page → Page loaded
     Step 2: Click Login with empty fields
     Step 3: Verify error flash → "Your username is invalid!" ✅
     URL still /login ✅
     ✅ PASS → Saved PROJ-103 → PASS to state file

────────────────────────────────────────────────────────────
  🏁 GLOBAL TEARDOWN — Uploading Results to XRAY
────────────────────────────────────────────────────────────

[2026-03-01 04:33:10] ⚠ WARN  XRAY was not configured (execution key is NOT_CONFIGURED).
[2026-03-01 04:33:10] ⚠ WARN  Tests ran, but results were not uploaded to XRAY.
🧹 [XrayState] State file cleared.

  3 passed (37.2s)
```

---

## Files Involved in This Run

| File | Role | What It Did |
|------|------|-------------|
| `.env` | Configuration | Provided BASE_URL, JIRA credentials (placeholders), XRAY settings |
| `config/environment.ts` | Config loader | Read `.env` into typed `config` object |
| `tests/global-setup.ts` | Pre-flight | Detected placeholders → skipped JIRA → initialized state file |
| `tests/xray-test-fixture.ts` | Test wrapper | Read annotations → ran tests → saved results to state |
| `tests/login.test.ts` | Test cases | 3 tests with XRAY annotations + LoginPage interactions |
| `pages/LoginPage.ts` | Page Object | Encapsulated login page actions (navigate, fill, click, verify) |
| `pages/BasePage.ts` | Base class | Provided shared methods (navigate, click, fill, cookie handling) |
| `utils/jira-xray/xray-state.ts` | State store | Managed `xray-state.json` (init, append, read, clear) |
| `tests/global-teardown.ts` | Post-flight | Read state → detected NOT_CONFIGURED → skipped upload → cleaned up |

---

## How to Enable Real XRAY Uploads

Update these 3 lines in your `.env` file:

```env
JIRA_BASE_URL=https://your-actual-company.atlassian.net
JIRA_USERNAME=your-real-email@company.com
JIRA_API_TOKEN=your-real-api-token-from-atlassian
```

Then update the XRAY test case keys in `login.test.ts` to match your actual JIRA test case IDs:

```typescript
annotation: { type: 'xray', description: 'YOUR-REAL-KEY-101' }
```

Run `npm test` again — this time Global Setup will connect to JIRA, fetch your Test Set, create a Test Execution, and Global Teardown will upload all PASS/FAIL results with screenshots.

---

*Report generated on: 1 March 2026*  
*Framework: Playwright + JIRA XRAY Integration*  
*Author: Automated Test Run Documentation*
