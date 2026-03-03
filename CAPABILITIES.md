# 🧰 CAPABILITIES — What Can This Framework Do?

### A Plain-English Guide for Absolute Beginners (Zero Coding Knowledge Required)

---

> **Who is this for?**
> You just joined the team. Someone told you "we use this Playwright framework."
> You opened the project and thought: *"What does this thing actually do? What's available to me?"*
>
> This document answers that question. Every capability is explained like you're 5.
>
> 💡 **Want to write a test right now?** Skip to **[WRITE_A_TEST.md](WRITE_A_TEST.md)** — it's a copy-paste guide with zero coding knowledge required.

---

## 📚 Table of Contents

1. [The One-Sentence Summary](#the-one-sentence-summary)
2. [All Capabilities at a Glance](#all-capabilities-at-a-glance)
3. [🌐 Browser Testing (Playwright)](#-browser-testing-playwright)
4. [📋 JIRA XRAY Integration](#-jira-xray-integration)
5. [🗃️ Database / Test Data](#️-database--test-data)
6. [📧 Email Verification](#-email-verification)
7. [🌐 API Testing Helper](#-api-testing-helper)
8. [📊 HTML Execution Report](#-html-execution-report)
9. [📸 Screenshot Capture](#-screenshot-capture)
10. [📝 Logger](#-logger)
11. [🍪 Cookie & Popup Handling](#-cookie--popup-handling)
12. [🔒 Security / Encryption](#-security--encryption)
13. [📑 Excel / Data-Driven Testing](#-excel--data-driven-testing)
14. [How to Add Your OWN New Utility](#how-to-add-your-own-new-utility)
15. [Which File Does What (Cheat Sheet)](#which-file-does-what-cheat-sheet)
16. [How to Enable/Disable Any Utility](#how-to-enabledisable-any-utility)

---

## The One-Sentence Summary

This framework opens a web browser (or calls REST APIs directly), tests your application automatically,
and then tells JIRA XRAY what happened — while generating a beautiful HTML report with charts, screenshots, and accessibility results.

---

## All Capabilities at a Glance

Here's everything this framework can do, at a glance:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     🧰 FRAMEWORK CAPABILITIES                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🟢 ACTIVE (works out of the box):                                       │
│     ✅ Browser Testing (UI)  — open Chrome, click, type, verify things   │
│     ✅ API Testing           — call REST endpoints, check responses      │
│     ✅ Page Objects          — organized code for each page of your app  │
│     ✅ HTML Execution Report — charts, screenshots, a11y, step logs      │
│     ✅ Screenshots           — automatic photos of the browser on failure │
│     ✅ Logger                — color-coded terminal messages + log files  │
│     ✅ Cookie/Popup handling — auto-dismisses banners and JS popups      │
│     ✅ Accessibility (a11y)  — WCAG scan run automatically after each UI test│
│                                                                          │
│  🟡 READY (just add credentials in .env to activate):                    │
│     📋 JIRA XRAY      — fetch test cases, create executions, push results│
│     🗃️  Database        — seed test data before, clean up after          │
│     📧 Email           — check test mailbox for OTPs, reset links, etc. │
│     🔒 Encryption      — AES-256 password protection for stored secrets  │
│     📑 Excel           — data-driven testing from .xlsx spreadsheets     │
│                                                                          │
│  ⚪ NOT configured utilities are SKIPPED automatically.                  │
│     Nothing crashes. You see a clear message in the terminal.            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Browser Testing (Playwright)

### What is it?
Playwright is the engine that drives this whole framework. It opens a real
web browser (Chrome) and controls it like a robot — clicking buttons, typing
text, navigating pages, and checking if things look right.

### What can it do?

| Action | Plain English | Example |
|--------|--------------|---------|
| Open a page | "Go to this web address" | `await page.goto('https://my-app.com/login')` |
| Click a button | "Click the Login button" | `await page.getByRole('button', { name: 'Login' }).click()` |
| Type text | "Type 'john@email.com' into the email box" | `await page.getByLabel('Email').fill('john@email.com')` |
| Check text exists | "Make sure the page says 'Welcome'" | `await expect(page.getByText('Welcome')).toBeVisible()` |
| Take a screenshot | "Take a photo of what the browser shows" | `await page.screenshot({ path: 'photo.png' })` |
| Wait for something | "Wait until the loading spinner disappears" | `await page.getByText('Loading').waitFor({ state: 'hidden' })` |

### Do I need to configure anything?
Just set `BASE_URL` in your `.env` file to your website's address. That's it.

```env
BASE_URL=https://your-app.com
```

### Where is the code?
- `pages/BasePage.ts` — reusable actions (click, fill, navigate, wait)
- `pages/LoginPage.ts` — login-specific actions (an example page)
- `tests/login.test.ts` — actual tests that use the page objects

---

## 📋 JIRA XRAY Integration

### What is it?
JIRA is where your team tracks work. XRAY is a plugin that adds test management.
This integration connects your automated Playwright tests to JIRA XRAY so that
test results appear directly inside your JIRA project — no manual work needed after initial setup.

---

### 🔑 The Most Important Rule to Understand

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   YOU DO MANUALLY (one-time, in JIRA web UI):                            │
│   ──────────────────────────────────────────                             │
│     1. Create Test Cases in XRAY     (PROJ-101, PROJ-102, PROJ-103...)  │
│     2. Create a Test Set in XRAY     (PROJ-456) to group them           │
│     3. Add your Test Cases to the Test Set                               │
│     4. Put XRAY_TEST_SET_ID=PROJ-456 in your .env file                  │
│                                                                          │
│   PLAYWRIGHT DOES AUTOMATICALLY (every time you run npm test):           │
│   ────────────────────────────────────────────────────────────           │
│     5. Reads Test Cases from the Test Set (via XRAY API)                │
│     6. Creates a new Test Execution ticket (PROJ-789) in JIRA           │
│     7. Links all Test Cases to the Execution                             │
│     8. Runs the tests in the browser (or via API)                        │
│     9. Saves PASS/FAIL for each test case                                │
│    10. Uploads results to XRAY (PROJ-101 → PASS, PROJ-102 → FAIL)      │
│    11. Attaches failure screenshots as evidence in JIRA                  │
│    12. Generates the HTML execution report locally                       │
│                                                                          │
│   YOU NEVER NEED TO:                                                     │
│   ──────────────────                                                     │
│     ❌ Create Test Executions manually                                   │
│     ❌ Mark tests as PASS/FAIL manually                                  │
│     ❌ Upload screenshots manually                                       │
│     ❌ Change any code when a new sprint starts (just update .env)       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 📐 Step-by-Step: Setting Up XRAY from Scratch (Complete Guide)

Follow these steps in order. Steps 1–4 are done **once** in JIRA. After that, everything is automated.

---

#### 🟢 Step 1: Create Test Cases in JIRA XRAY (Manual — One Time)

Open your JIRA project and create XRAY Test Case tickets for each scenario you want to test.

**How to create a Test Case:**
1. In JIRA, click **Create** (top menu bar)
2. Set **Issue Type** to **Test** (XRAY adds this type)
3. Fill in:
   - **Summary**: A clear one-sentence description (e.g., "Verify user can log in with valid credentials")
   - **Steps**: The manual steps a human would follow (XRAY shows a table for steps)
   - **Labels** (optional): Add labels like `smoke`, `regression`, `sprint5` for filtering
4. Click **Create**
5. Note down the issue key (e.g., `PROJ-101`)

**Repeat for each test scenario:**
```
PROJ-101  →  "Verify user can log in with valid credentials"
PROJ-102  →  "Verify wrong password shows an error message"
PROJ-103  →  "Verify empty fields shows validation errors"
PROJ-104  →  "Verify GET /posts/1 returns status 200 and valid post data"
PROJ-105  →  "Verify POST /posts creates a new resource with status 201"
PROJ-106  →  "Verify GET /users/1 returns user data with address"
```

> 💡 **Best Practice:** Name your test cases with a clear action + expected result.
> Use prefixes like `TC01:`, `TC02:` in the Playwright test name (not in JIRA).
> Keep the JIRA summary clean — the framework uses the Playwright test name in the report.

---

#### 🟢 Step 2: Create a Test Set in JIRA XRAY (Manual — One Time)

A Test Set is simply a **folder** that groups related Test Cases together.

**How to create a Test Set:**
1. In JIRA, click **Create**
2. Set **Issue Type** to **Test Set** (XRAY adds this type)
3. Fill in:
   - **Summary**: A descriptive name (e.g., "Sprint 5 — Login & API Tests")
4. Click **Create**
5. Note down the issue key (e.g., `PROJ-456`)

---

#### 🟢 Step 3: Add Test Cases to the Test Set (Manual — One Time)

1. Open your new Test Set ticket (e.g., `PROJ-456`) in JIRA
2. Scroll to the **Tests** section (added by XRAY)
3. Click **Add** → search for each test case key → add them:
   - PROJ-101, PROJ-102, PROJ-103, PROJ-104, PROJ-105, PROJ-106
4. Now your Test Set contains all 6 test cases

```
Test Set: PROJ-456 ("Sprint 5 — Login & API Tests")
├── PROJ-101  "Verify user can log in with valid credentials"
├── PROJ-102  "Verify wrong password shows an error message"
├── PROJ-103  "Verify empty fields shows validation errors"
├── PROJ-104  "Verify GET /posts/1 returns status 200"
├── PROJ-105  "Verify POST /posts creates a new resource"
└── PROJ-106  "Verify GET /users/1 returns user data"
```

> 💡 **Best Practice:** Create one Test Set per sprint or per feature.
> When a new sprint starts, create a new Test Set or update the existing one.
> The old Test Sets (and their Executions) stay in JIRA as history.

---

#### 🟢 Step 4: Configure Your `.env` File (Manual — One Time per Sprint)

Open your `.env` file and set the XRAY values:

```env
# ──── JIRA CONNECTION (get these from your JIRA admin) ────
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_USERNAME=your-email@company.com
JIRA_API_TOKEN=your-api-token-here

# ──── XRAY SETTINGS ────
XRAY_PROJECT_KEY=PROJ              # The short code in your ticket numbers
XRAY_TEST_SET_ID=PROJ-456         # The Test Set you just created (Step 2)
XRAY_SPRINT_NUMBER=5               # Current sprint number (update each sprint)
```

**How to get a JIRA API Token:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token** → give it a name (e.g., "Playwright Automation")
3. Copy the token → paste it as `JIRA_API_TOKEN` in `.env`

> 💡 **Best Practice per Sprint:**
> At the start of each sprint, update TWO things in `.env`:
> 1. `XRAY_SPRINT_NUMBER` → increment by 1
> 2. `XRAY_TEST_SET_ID` → update if you created a new Test Set for this sprint

---

#### 🟢 Step 5: Link Each Playwright Test to Its XRAY Test Case (One Time per Test)

In your Playwright test file, each test has an **annotation** that says which
XRAY test case it represents. This is the bridge between your code and JIRA.

```typescript
test(
  'TC01: Valid credentials should log the user in successfully',
  {
    annotation: { type: 'xray', description: 'PROJ-101' },
    //                                        ^^^^^^^^
    //                                        This MUST match the JIRA key
    //                                        of the Test Case you created
    //                                        in Step 1
  },
  async ({ page, xrayTestKey }) => {
    // xrayTestKey is automatically "PROJ-101" — extracted from the annotation
    // Your test code here...
  }
);
```

**The mapping looks like this:**
```
Playwright Test File                        XRAY Test Case in JIRA
──────────────────────────                  ─────────────────────────
annotation: 'PROJ-101'   ←──── matches ──→  PROJ-101 in Test Set PROJ-456
annotation: 'PROJ-102'   ←──── matches ──→  PROJ-102 in Test Set PROJ-456
annotation: 'PROJ-103'   ←──── matches ──→  PROJ-103 in Test Set PROJ-456
annotation: 'PROJ-104'   ←──── matches ──→  PROJ-104 in Test Set PROJ-456
```

> ⚠️ **The annotation description MUST exactly match the JIRA test case key.**
> `'PROJ-101'` in your code must be the same as the issue key in JIRA.
> If they don't match, the result won't upload for that test.

---

#### 🟢 Step 6: Run Tests — Everything Else is Automatic (Every Run)

```bash
npm test
```

**Here's exactly what happens under the hood:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: GLOBAL SETUP (runs ONCE before all tests)                       │
│                                                                          │
│  1. Framework reads .env → gets JIRA URL, credentials, Test Set ID      │
│  2. Calls JIRA API /rest/api/3/myself → verifies credentials work       │
│  3. Calls XRAY API /rest/raven/1.0/api/testset/PROJ-456/test            │
│     → gets list: [PROJ-101, PROJ-102, PROJ-103, ...]                    │
│  4. Calls XRAY API POST /rest/raven/1.0/api/testexecution               │
│     → JIRA creates new ticket: PROJ-789                                  │
│     → Title: "Sprint 5 — Automated Playwright Test Run [2026-03-03]"    │
│  5. Links all 6 test cases to PROJ-789                                   │
│     → All show status "TODO" in JIRA                                     │
│  6. Saves executionKey="PROJ-789" to xray-state.json                     │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: TESTS RUN (each test independently)                             │
│                                                                          │
│  For EACH test:                                                          │
│  7. Fixture reads annotation → xrayTestKey = "PROJ-101"                 │
│  8. Test runs (browser clicks / API calls / assertions)                  │
│  9. After test finishes:                                                 │
│     a) Captures screenshot if FAIL                                       │
│     b) Runs accessibility scan (axe-core) if UI test                     │
│     c) Maps Playwright status → XRAY status:                             │
│        "passed"     → "PASS"                                             │
│        "failed"     → "FAIL"                                             │
│        "timedOut"   → "FAIL"                                             │
│        "interrupted"→ "ABORTED"                                          │
│     d) Appends { testCaseKey, status, screenshot, error } to             │
│        xray-state.json                                                   │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: GLOBAL TEARDOWN (runs ONCE after all tests)                     │
│                                                                          │
│  10. Reads xray-state.json → gets executionKey + all results             │
│  11. For EACH result:                                                    │
│      a) Calls XRAY API GET /testexecution/PROJ-789/test → finds the     │
│         internal testRunId for this test case                             │
│      b) Calls XRAY API PUT /testrun/{id} → updates status to PASS/FAIL  │
│      c) If FAIL: calls XRAY API POST /testrun/{id}/attachment            │
│         → uploads screenshot as Base64 evidence                          │
│  12. Fetches final execution status from XRAY (confirmation)             │
│  13. Generates HTML report → reports/execution-report-YYYY-MM-DD.html   │
│  14. Cleans up xray-state.json for next run                              │
│  15. Cleans up database test data (if DB configured)                     │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ RESULT IN JIRA:                                                          │
│                                                                          │
│  PROJ-789 (Test Execution)                                               │
│  ├── PROJ-101: ✅ PASS  (3.2s)                                          │
│  ├── PROJ-102: ❌ FAIL  (4.1s) — screenshot attached as evidence        │
│  ├── PROJ-103: ✅ PASS  (2.8s)                                          │
│  ├── PROJ-104: ✅ PASS  (0.8s)                                          │
│  ├── PROJ-105: ✅ PASS  (1.1s)                                          │
│  └── PROJ-106: ✅ PASS  (0.6s)                                          │
│                                                                          │
│  Click PROJ-102 → see screenshot + error message + execution time        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 🏗️ XRAY Architecture — Which File Does What

```
.env                              ← Your JIRA credentials + Test Set ID
    │
    ▼
config/environment.ts             ← Reads .env → exports config.jira.*, config.xray.*
    │
    ▼
tests/global-setup.ts             ← PHASE 1: Orchestrates the full setup flow
    │
    ├──→ utils/jira-xray/jira-auth.ts
    │      └─ createJiraApiClient()    → pre-configured HTTP client for JIRA API
    │      └─ testJiraConnection()     → calls /rest/api/3/myself to verify auth
    │
    ├──→ utils/jira-xray/xray-test-set.ts
    │      └─ fetchTestCasesFromTestSet()  → calls XRAY API to get test case list
    │
    ├──→ utils/jira-xray/xray-test-execution.ts
    │      └─ createTestExecution()    → creates JIRA ticket of type "Test Execution"
    │      └─ links all test cases     → sets them to "TODO" status
    │
    └──→ utils/jira-xray/xray-state.ts
           └─ initializeXrayState()    → saves executionKey to xray-state.json
    │
    ▼
tests/xray-test-fixture.ts       ← PHASE 2: Wraps every test with XRAY tracking
    │
    ├──→ Reads annotation → extracts xrayTestKey ("PROJ-101")
    ├──→ After test: maps Playwright status → XRAY status
    ├──→ Captures failure screenshot
    └──→ appendTestResult() → writes to xray-state.json
    │
    ▼
tests/global-teardown.ts          ← PHASE 3: Uploads all results to XRAY
    │
    ├──→ readXrayState()           → reads xray-state.json
    ├──→ utils/jira-xray/xray-result-updater.ts
    │      └─ updateMultipleTestResults()  → loops through each result
    │      └─ updateTestCaseResult()       → PUTs status + evidence to XRAY API
    │      └─ attachEvidenceToTestRun()    → uploads screenshot as Base64
    │
    ├──→ getTestExecutionStatus()  → confirmation check from XRAY
    ├──→ generateReport()          → HTML report with charts + step logs
    └──→ clearXrayState()          → cleanup for next run
```

---

### 🏆 Best Practices for XRAY Integration

| # | Best Practice | Why |
|---|--------------|-----|
| 1 | **Create Test Cases in JIRA first, then write the Playwright test** | The JIRA test case key (PROJ-101) is the link. If you write code first, you'll need to go back and add the annotation later. |
| 2 | **One Playwright test = One XRAY Test Case** | If two tests report to the same XRAY key, the second result overwrites the first. |
| 3 | **Keep XRAY test case summaries short and descriptive** | They show in JIRA dashboards. "Verify login with valid credentials" is better than "test1". |
| 4 | **Use clear Playwright test names with TC## prefix** | `TC01: Valid credentials should log the user in` — the TC## prefix makes it easy to match to JIRA. |
| 5 | **Update `XRAY_SPRINT_NUMBER` every sprint** | This names the Test Execution "Sprint 6 — Automated Run". Without it, executions are harder to find. |
| 6 | **Create a new Test Set per sprint (or reuse one)** | New sprints may add or remove test cases. Update `XRAY_TEST_SET_ID` accordingly. |
| 7 | **Never delete old Test Executions** | They are your test run history. JIRA keeps them forever so you can compare sprint-over-sprint. |
| 8 | **Add labels to Test Cases for filtering** | Labels like `smoke`, `regression`, `login` help filter which tests to include in a Test Set. |
| 9 | **Let the framework create Test Executions** | Never create them manually. The framework names them with the date and sprint, links test cases, and handles everything. |
| 10 | **If JIRA is down, tests still run** | The framework detects JIRA unavailability and skips the integration. Your tests and HTML report still work. |

---

### 🔁 What to Do Each Sprint (Checklist)

```
□ Step 1: (If needed) Create new Test Cases in JIRA for new features
□ Step 2: (If needed) Create a new Test Set or add new cases to the existing one
□ Step 3: (If new tests) Write the Playwright test with the annotation:
            annotation: { type: 'xray', description: 'PROJ-NEW' }
□ Step 4: Update .env:
            XRAY_SPRINT_NUMBER=6       ← new sprint number
            XRAY_TEST_SET_ID=PROJ-XXX  ← if you created a new Test Set
□ Step 5: Run: npm test
□ Step 6: Open JIRA → find the new Test Execution → review results
□ Step 7: (done — the framework did everything else automatically)
```

---

### 📊 XRAY API Endpoints Used by This Framework

For reference, here are the exact XRAY REST API endpoints our framework calls:

| Step | HTTP Method | Endpoint | Purpose |
|------|-------------|----------|---------|
| Auth check | `GET` | `/rest/api/3/myself` | Verify JIRA credentials work |
| Get Test Set | `GET` | `/rest/api/3/issue/{testSetKey}` | Fetch Test Set summary |
| List tests in set | `GET` | `/rest/raven/1.0/api/testset/{testSetKey}/test` | Get all test case keys in the set |
| Get test details | `GET` | `/rest/api/3/issue/{testCaseKey}` | Fetch test case summary, labels, status |
| Get test steps | `GET` | `/rest/raven/1.0/api/test/{testCaseKey}/step` | Fetch test steps for a test case |
| Create execution | `POST` | `/rest/raven/1.0/api/testexecution` | Create a new Test Execution JIRA ticket |
| Link tests to exec | `POST` | `/rest/raven/1.0/api/testexecution/{execKey}/test` | Link test cases to the execution |
| Get test runs | `GET` | `/rest/raven/1.0/api/testexecution/{execKey}/test` | Get test run IDs within the execution |
| Update result | `PUT` | `/rest/raven/1.0/api/testrun/{testRunId}` | Set PASS/FAIL status + comment |
| Attach evidence | `POST` | `/rest/raven/1.0/api/testrun/{testRunId}/attachment` | Upload screenshot as Base64 |

> These are **XRAY Server/Data Center** endpoints. If you use **XRAY Cloud**, the endpoints
> are different (GraphQL-based). See [XRAY Cloud docs](https://docs.getxray.app/display/XRAYCLOUD/).

---

### ❓ What if I DON'T Configure JIRA?

Nothing breaks. You see this friendly message and tests run normally:

```
⚠️  JIRA credentials are still set to placeholder values in .env.
   Skipping JIRA/XRAY integration — Playwright tests will still run.
```

The HTML report is **still generated** with full results, charts, and screenshots.
The only thing missing is the JIRA upload — results stay local only.

### Where is the code?
- `utils/jira-xray/jira-auth.ts` — JIRA API authentication (Basic Auth over HTTP)
- `utils/jira-xray/xray-test-set.ts` — fetches Test Cases from a Test Set via XRAY API
- `utils/jira-xray/xray-test-execution.ts` — creates Test Execution ticket, links Test Cases
- `utils/jira-xray/xray-result-updater.ts` — uploads PASS/FAIL status + screenshot evidence
- `utils/jira-xray/xray-state.ts` — shared JSON file that stores execution key + results between phases
- `tests/xray-test-fixture.ts` — the Playwright fixture that automatically reports results
- `tests/global-setup.ts` — orchestrates Phase 1 (auth → fetch → create execution)
- `tests/global-teardown.ts` — orchestrates Phase 3 (upload results → generate report)

---

## 🗃️ Database / Test Data

### What is it?
Some tests need data to already exist in the database BEFORE the test runs.
For example:
- A test that checks "View Order History" needs orders to exist first
- A test that checks "Login" might need a specific user created first

This utility lets you:
- **SEED** (insert) test data before tests start
- **QUERY** (check) data during tests
- **CLEANUP** (delete) test data after tests finish

### What databases does it support?
It's designed to work with ANY database. You just plug in your connection code:
- PostgreSQL ✅
- MySQL ✅
- MongoDB ✅
- SQLite ✅
- Any other database with a Node.js driver ✅

### How to enable it?

```env
DB_ENABLED=true
DB_HOST=your-database-server.com
DB_PORT=5432
DB_NAME=your_test_database
DB_USER=your_db_username
DB_PASSWORD=your_db_password
```

### How to use it in code?

```typescript
// SEED: Create test data before tests
import { seedTestData } from '../utils';

await seedTestData('users', {
  username: 'testuser_automation',
  email: 'test@automation.com',
}, 'Test user for login tests');

// QUERY: Check data during tests
import { queryTestData } from '../utils';

const result = await queryTestData('orders', { userId: '12345' });

// CLEANUP happens automatically in global-teardown.ts
// (deletes everything that was seeded)
```

### What if I DON'T configure the database?
Nothing breaks. Database operations are silently skipped.

### Where is the code?
- `utils/database/test-data-manager.ts`

### ⚠️ Important: You need to add your database driver
The file has placeholder comments showing EXACTLY where to plug in your
PostgreSQL/MySQL/MongoDB code. Search for `🔌 PLUG YOUR DATABASE CLIENT HERE`
in the file.

---

## 📧 Email Verification

### What is it?
Some tests involve email. For example:
- "Forgot Password" sends a reset link via email
- "Sign Up" sends a verification code (OTP) via email
- "Two-Factor Auth" sends a 6-digit code via email

This utility lets your tests:
- **Wait for an email** to arrive at a test inbox
- **Extract a verification code** (like `482901`) from the email
- **Extract a link** (like `https://app.com/reset?token=abc`) from the email

### How does it work?
You CAN'T open Gmail/Outlook from a Playwright test. Instead, you use a
**test mailbox service** — a special email inbox with an API that code can read.

Popular services (pick one):

| Service | Free Tier | Website |
|---------|----------|---------|
| **Mailosaur** | 20 emails/day | https://mailosaur.com |
| **MailSlurp** | 100 emails/month | https://mailslurp.com |
| **Mailtrap** | 100 emails/month | https://mailtrap.io |

### How to enable it?

```env
EMAIL_ENABLED=true
EMAIL_SERVICE=mailosaur
EMAIL_API_KEY=your-api-key-from-the-service
EMAIL_SERVER_ID=your-server-id
```

### How to use it in code?

```typescript
import { waitForEmail, extractVerificationCode, extractLink } from '../utils';

// 1. Your test clicks "Forgot Password" on the website
await page.getByText('Forgot Password?').click();
await page.getByLabel('Email').fill('testuser@your-mailosaur-server.mailosaur.io');
await page.getByRole('button', { name: 'Send Reset Link' }).click();

// 2. Wait for the reset email to arrive (waits up to 30 seconds)
const result = await waitForEmail(
  'testuser@your-mailosaur-server.mailosaur.io',
  'Reset your password'    // ← partial subject line to match
);

// 3. Extract the reset link from the email body
if (result.success && result.email) {
  const resetLink = extractLink(result.email.body, /reset-password/);
  // 4. Navigate to the reset link
  await page.goto(resetLink!);
}

// OR: Extract a 6-digit OTP code
const code = extractVerificationCode(result.email!.body, 6);
// code = "482901"
```

### What if I DON'T configure email?
Nothing breaks. Email functions return `{ success: false, message: 'not configured' }`.

### Where is the code?
- `utils/email/email-verifier.ts`

### ⚠️ Important: You need to add your email service API calls
The file has placeholder comments showing EXACTLY where to plug in your
Mailosaur/MailSlurp/Mailtrap code. Search for `🔌 PLUG YOUR EMAIL SERVICE API HERE`.

---

## 🌐 API Testing Helper

### What is it?
Sometimes your test needs to talk to the backend server directly — not through
the browser UI. This is called "API testing." Common reasons:

- **Before a test:** Create test data via API (faster than clicking through UI)
- **During a test:** Verify something happened on the server side
- **After a test:** Clean up data via API

### What can it do?

| Method | What it does | Example |
|--------|-------------|---------|
| `apiGet(url)` | Read data | "Get me the list of users" |
| `apiPost(url, data)` | Create data | "Create a new order with these items" |
| `apiPut(url, data)` | Update data | "Change this user's name to Jane" |
| `apiDelete(url)` | Delete data | "Delete test user #12345" |

### How to use it in code?

```typescript
import { apiGet, apiPost, apiDelete } from '../utils';

// GET: Fetch data from an API
const users = await apiGet('/api/users');
// users.data = [{ id: 1, name: "John" }, { id: 2, name: "Jane" }]

// POST: Create something via API
const newOrder = await apiPost('/api/orders', {
  item: 'Widget',
  quantity: 5,
  price: 9.99,
});
// newOrder.data = { id: 42, item: "Widget", status: "created" }

// DELETE: Clean up after your test
await apiDelete('/api/orders/42');
```

### How to configure it?

```env
# If your API is at a different URL than your website:
API_BASE_URL=https://api.your-app.com

# If your API requires a token:
API_AUTH_TOKEN=your-bearer-token-here
```

If you leave `API_BASE_URL` blank, it defaults to `BASE_URL` (your website address).

### Where is the code?
- `utils/api/api-helper.ts`

---

## 📊 HTML Execution Report

### What is it?
After every test run, the framework automatically generates a single **HTML file** you can open
in any browser. It shows the full picture of what happened — charts, test results, screenshots,
step logs, and more. No server needed, no login required — just open the file.

### What does the report contain?

| Section | What You'll See |
|---------|----------------|
| **Header** | Environment (dev/staging/prod), sprint number, total duration, run date |
| **Summary Cards** | Total tests, passed, failed, pass rate %, suite duration, UI count, API count |
| **Charts** | Pass/Fail donut, test type breakdown, duration bar chart, a11y issues |
| **Results Table** | Every test with: full name, 🖥️ UI / 🔌 API badge, PASS/FAIL badge, start time, duration |
| **Screenshots** | Failure screenshots shown inline — click to zoom |
| **Step Log Accordion** | Expand any test to see every log message from that test |
| **Accessibility Table** | All a11y violations found across tests (impact, element, message) |
| **Performance Table** | Page load and navigation timing per test |
| **XRAY Section** | Execution key, JIRA link, or demo-mode explanation if JIRA not configured |

### Where is the report saved?
```
reports/execution-report-YYYY-MM-DD.html
```
A new file is created for each day. Old reports are never deleted automatically.

### How to open it?
Just open the file in any browser — Chrome, Firefox, Safari, Edge.
Or right-click the file in VS Code → **Open with Live Server**.

### Do I need to do anything?
No. The report is generated automatically at the end of every `npm test` run.

### Where is the code?
- `utils/reporting/report-generator.ts`
- `utils/helpers/enhanced-logger.ts` — collects structured data during the run

---

## 📸 Screenshot Capture

### What is it?
Takes a photo of what the browser is showing at any moment. Screenshots are
the #1 debugging tool — when a test fails, the screenshot shows you exactly
what the user would have seen.

### When are screenshots taken?
- **Automatically on failure** — the framework captures a screenshot whenever a
  test fails (you don't need to do anything)
- **Manually in your test** — you can capture screenshots at any point

### How to use it in code?

```typescript
import { captureScreenshot } from '../utils';

// Take a screenshot at any point in your test
await captureScreenshot(page, 'my-test', 'after-login');
// Saves to: test-results/screenshots/my-test_after-login_2026-03-01T04-55-00.png
```

### Where are screenshots saved?
`test-results/screenshots/` — this folder is created automatically.

### Where is the code?
- `utils/helpers/screenshot.ts`

---

## 📝 Logger

### What is it?
Prints formatted, color-coded messages in the terminal so you can follow
what's happening during the test run. Much better than plain `console.log()`.

### What do the messages look like?

```
[2026-03-01 04:55:10] ℹ INFO   Page loaded: The Internet        ← blue, informational
[2026-03-01 04:55:10] ▶ STEP   Clicking: Login button            ← blue, action step
[2026-03-01 04:55:10] ✅ PASS  TC01 passed — Login successful    ← green, success
[2026-03-01 04:55:10] ❌ FAIL  TC02 — Wrong error message shown  ← red, failure
[2026-03-01 04:55:10] ⚠ WARN   JIRA not configured, skipping     ← yellow, warning
```

### How to use it in code?

```typescript
import { logger } from '../utils';

logger.info('Page loaded successfully');     // Blue informational message
logger.step('Clicking the submit button');   // Blue action step
logger.pass('Test passed!');                 // Green success message
logger.fail('Test failed', 'Error details'); // Red failure message
logger.warn('Something unexpected');         // Yellow warning
logger.error('Critical failure');            // Red error
logger.section('=== NEW SECTION ===');       // Visual separator
```

### Where is the code?
- `utils/helpers/logger.ts`

---

## 🍪 Cookie & Popup Handling

### What is it?
Many websites show annoying popups that block your tests:
- Cookie consent banners ("Accept All Cookies")
- Browser alerts/confirms/prompts (JavaScript popups)

This framework handles BOTH automatically. You don't need to do anything.

### How does it work?

| Popup Type | How It's Handled | Where |
|-----------|-----------------|-------|
| **Browser alerts/confirms** (JavaScript popups) | Auto-accepted before every test | `tests/xray-test-fixture.ts` |
| **Cookie banners** (HTML overlay buttons) | Auto-clicked when navigating | `pages/BasePage.ts` → `dismissCookieBanner()` |

### What cookie button texts does it recognize?
The framework looks for buttons with these texts (case-insensitive):
- "Accept All" / "Accept Cookies"
- "I Accept" / "Allow All"
- "Agree" / "Got it" / "OK, got it"
- "Continue"

If no cookie banner is found, it silently moves on. No error, no delay.

### Do I need to configure anything?
No. This is always active automatically.

---

## 🔒 Security / Encryption

### What is it?
When you store passwords or API tokens, they are normally visible as plain text in your `.env` file.
The encryption utility lets you store them as scrambled, unreadable text — so even if someone
sees your file, they can't read the secrets.

### How to enable it?

```env
# Set a secret key (at least 16 characters, keep this very private!)
ENCRYPTION_KEY=my-super-secret-key-32chars
```

### How to use it in code?

```typescript
import { encrypt, decrypt, hashPassword } from '../utils';

// Encrypt a value to store it safely
const encryptedPassword = encrypt('my-plain-password');
// → "enc:a1b2c3d4..."

// Decrypt when you need to use it
const plain = decrypt(encryptedPassword);
// → "my-plain-password"

// Hash a password (one-way — cannot be reversed)
const hashed = hashPassword('my-password');
```

### Where is the code?
- `utils/security/crypto-helper.ts`

---

## 📑 Excel / Data-Driven Testing

### What is it?
Sometimes you want to run the same test with MANY different sets of data.
For example, test login with 50 different username/password combinations.
Instead of writing 50 separate tests, you put the data in an Excel spreadsheet
and the framework reads it and runs the test once per row.

### What can it do?

| Action | Description |
|--------|------------|
| Read a sheet | Get all rows from a specific sheet as an array of objects |
| Read all sheets | Get every sheet from the workbook at once |
| Get sheet names | List all the tab names in an Excel file |
| Write results | Write pass/fail results back into the Excel file |
| Data Pool | Randomly pick test data rows to avoid conflicts in parallel runs |

### How to use it in code?

```typescript
import { readExcelSheet, DataPool } from '../utils';

// Read all rows from the "LoginData" tab of a spreadsheet
const rows = readExcelSheet('test-data/users.xlsx', 'LoginData');
// rows = [ { username: 'alice', password: 'pass1' }, { username: 'bob', password: 'pass2' }, ... ]

// Data Pool — picks a unique row per parallel worker (no conflicts)
const pool = new DataPool(rows);
const myRow = pool.acquire();
```

### Where is the code?
- `utils/excel/excel-reader.ts`
- `utils/excel/data-pool.ts`

---

## How to Add Your OWN New Utility

Want to add something new? Maybe Teams notifications, AWS S3 upload, or a
custom reporting tool? Follow this recipe:

### Step 1: Create a folder and file

```
utils/
└── my-new-tool/                    ← Create this folder
    └── my-new-tool.ts              ← Create this file
```

### Step 2: Write your utility with this template

```typescript
// utils/my-new-tool/my-new-tool.ts
import { config } from '../../config/environment';
import { logger } from '../helpers/logger';

// CHECK function: Is this utility configured?
export function isMyToolConfigured(): boolean {
  return config.myTool.apiKey !== '' && config.myTool.apiKey !== 'placeholder';
}

// MAIN function: Do the thing
export async function doSomethingCool(): Promise<void> {
  if (!isMyToolConfigured()) {
    logger.warn('MyTool not configured — skipping.');
    return;
  }

  // Your actual logic here
  logger.pass('MyTool did the thing!');
}
```

### Step 3: Add config to `config/environment.ts`

Open `config/environment.ts` and add a new section:

```typescript
myTool: {
  apiKey: getOptionalEnvVar('MY_TOOL_API_KEY', ''),
  someOtherSetting: getOptionalEnvVar('MY_TOOL_SETTING', 'default'),
},
```

### Step 4: Add env vars to `.env` and `.env.example`

```env
# My New Tool
MY_TOOL_API_KEY=your-key-here
MY_TOOL_SETTING=some-value
```

### Step 5: Wire it in (pick where it makes sense)

| If your utility should run... | Add it to... |
|------------------------------|-------------|
| Once BEFORE all tests | `tests/global-setup.ts` |
| Once AFTER all tests | `tests/global-teardown.ts` |
| Inside individual tests | Import it directly in your `.test.ts` file |
| Around every test (before + after) | `tests/xray-test-fixture.ts` |

### Step 6: Add to the barrel file (optional, for clean imports)

Open `utils/index.ts` and add:

```typescript
export { isMyToolConfigured, doSomethingCool } from './my-new-tool/my-new-tool';
```

Now anyone can import it with: `import { doSomethingCool } from '../utils';`

### That's it! 🎉

The framework will show your tool in the Utility Status Dashboard:
```
📋 Utility Status Dashboard
  🔹 JIRA XRAY:  ✅ Configured
  🔹 My Tool:    ✅ Configured          ← your new utility!
```

---

## Which File Does What (Cheat Sheet)

| File | One-Line Purpose |
|------|-----------------|
| **`.env`** | Your private settings (URLs, passwords, API keys) |
| **`config/environment.ts`** | Reads `.env` and makes it available as `config.xxx` |
| **`tests/global-setup.ts`** | Runs ONCE before tests — XRAY setup, DB seed, utility checks |
| **`tests/global-teardown.ts`** | Runs ONCE after all tests — XRAY upload, HTML report, DB cleanup |
| **`tests/xray-test-fixture.ts`** | Wraps every test with XRAY reporting + a11y scan + popup handling |
| **`tests/login.test.ts`** | UI test cases — 3 login tests (TC01–TC03) |
| **`tests/api.test.ts`** | API test cases — 3 REST API tests (TC04–TC06) |
| **`pages/BasePage.ts`** | Reusable browser actions — click, fill, navigate, wait |
| **`pages/LoginPage.ts`** | Login page specific actions — enter username, click login |
| **`utils/jira-xray/*.ts`** | Everything JIRA/XRAY — auth, fetch tests, create execution, upload results |
| **`utils/reporting/report-generator.ts`** | Builds the full HTML execution report with charts and screenshots |
| **`utils/database/test-data-manager.ts`** | Seeds and cleans up test data in your database |
| **`utils/database/db-connection.ts`** | Secure database connection wrapper |
| **`utils/email/email-verifier.ts`** | Waits for emails, extracts OTP codes and links |
| **`utils/api/api-helper.ts`** | Makes GET/POST/PUT/DELETE API calls |
| **`utils/excel/excel-reader.ts`** | Reads test data rows from Excel (.xlsx) spreadsheets |
| **`utils/excel/data-pool.ts`** | Manages data rows for parallel test execution (no conflicts) |
| **`utils/security/crypto-helper.ts`** | AES-256 encrypt/decrypt passwords and stored secrets |
| **`utils/helpers/logger.ts`** | Color-coded terminal logging |
| **`utils/helpers/enhanced-logger.ts`** | Structured data collector for the HTML report (logs, perf, a11y) |
| **`utils/helpers/screenshot.ts`** | Captures browser screenshots |
| **`utils/index.ts`** | Barrel file — import anything from one place |
| **`playwright.config.ts`** | Playwright settings (browsers, timeouts, retries) |

---

## How to Enable/Disable Any Utility

Every utility is controlled by your `.env` file. Here's the master switch for each:

| Utility | How to Enable | How to Disable |
|---------|--------------|----------------|
| **Playwright (UI tests)** | Always on (it's the core) | Can't disable |
| **API Testing** | Always on (no config needed) | Can't disable |
| **HTML Report** | Always on — generated after every run | Can't disable |
| **JIRA XRAY** | Set real values for `JIRA_BASE_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` | Leave the placeholder values — tests still run |
| **Database** | Set `DB_ENABLED=true` + fill connection details | Set `DB_ENABLED=false` |
| **Email** | Set `EMAIL_ENABLED=true` + fill API key | Set `EMAIL_ENABLED=false` |
| **API Helper base URL** | Set `API_BASE_URL` (optional — defaults to `BASE_URL`) | Leave empty |
| **Encryption** | Set `ENCRYPTION_KEY` (min 16 chars) | Leave empty — passwords stay as plain text |
| **Excel** | Import `readExcelSheet` in your test — no `.env` needed | Just don't use it |
| **Screenshots** | Always on automatically | Can't disable |
| **Logger** | Always on automatically | Can't disable |
| **Accessibility scan** | Always on automatically after every UI test | Can't disable |
| **Cookie handling** | Always on automatically | Can't disable |

### The Golden Rule

> **If you don't configure it, it won't run. If it won't run, it won't crash.**
>
> Every utility checks itself before doing anything. No configuration = no action = no error.

---

*Last updated: 3 March 2026*
*Framework: Playwright + JIRA XRAY + Multi-Utility Architecture*
*Tests: 3 UI (login) + 3 API (REST) = 6 total*
