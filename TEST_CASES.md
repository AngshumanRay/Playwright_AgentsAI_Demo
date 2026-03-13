# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║          📋 TEST CASES — Traceability Matrix                             ║
# ║          User Stories → Test Cases → Test Scripts                        ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

> **Purpose**: This document creates a complete traceability chain from
> **User Stories** (business requirements) through **Test Cases** (what to verify)
> down to **Test Scripts** (automated Playwright code). Every test in this
> framework can be traced back to a business need.

---

## 📊 Traceability Summary

| User Story | Test Cases | Test Scripts | XRAY Keys | Executions |
|---|---|---|---|---|
| US-01 Authentication | TC01, TC02, TC03 | `login.test.ts` | PROJ-101 – 103 | 4 (TC01 ×2) |
| US-02 REST API Validation | TC04, TC05, TC06 | `api.test.ts` | PROJ-104 – 106 | 3 |
| US-03 Site Navigation | TC07, TC08, TC09, TC10, TC11 | `playwright-dev.test.ts` | PROJ-107 – 111 | 5 |
| US-04 Iframe Interaction | TC12, TC13 | `salesforce-iframe.test.ts` | PROJ-112 – 113 | 2 |
| **TOTAL** | **13 test cases** | **4 test files** | **13 XRAY keys** | **14 executions** |

---

## 🗺️ How to Read This Document

```
  User Story (WHY)            Test Case (WHAT)              Test Script (HOW)
  ─────────────────── ───→ ─────────────────────── ───→ ──────────────────────
  US-01: As a user,         TC01: Valid credentials        login.test.ts
  I want to log in          should log the user in         → PROJ-101
  securely...               successfully                   → getTestData('PROJ-101')
```

Each section below follows this chain:
1. **User Story** — the business requirement (written in Agile format)
2. **Test Cases** — specific scenarios to verify (with preconditions, steps, expected results)
3. **Test Script Mapping** — exact file, function, XRAY key, and YAML data source

---

# ═══════════════════════════════════════════════════════════════════════════
# US-01: USER AUTHENTICATION
# ═══════════════════════════════════════════════════════════════════════════

## 📖 User Story US-01

> **As a** registered user,
> **I want to** log in to the application using my credentials,
> **So that** I can access my secure dashboard and personal content.

**Acceptance Criteria:**
- ✅ AC-1: Valid username + password → user is redirected to the secure area
- ✅ AC-2: Valid username + wrong password → error message is displayed, user stays on login page
- ✅ AC-3: Empty credentials → validation error is displayed, user stays on login page
- ✅ AC-4: Passwords must be stored/transmitted encrypted (AES-256)

---

### TC01: Valid credentials should log the user in successfully

| Field | Value |
|---|---|
| **Test Case ID** | TC01 |
| **XRAY Key** | PROJ-101 |
| **Priority** | High |
| **Type** | Positive / Happy Path |
| **Acceptance Criteria** | AC-1 |
| **Parameterized** | ✅ Yes — 2 data sets (runs twice) |

**Preconditions:**
- Application is accessible at `BASE_URL`
- Valid user account exists (username: `tomsmith`)
- Password is encrypted in YAML using `${ENC:...}` syntax

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the login page (`/login`) | Login page loads with username/password fields visible |
| 2 | Enter valid username and encrypted password | Fields are populated correctly |
| 3 | Click the Login button | Form is submitted |
| 4 | Verify URL contains `/secure` | User is redirected to the secure area |
| 5 | Verify the secure page content is visible | Dashboard/welcome message is displayed |

**Test Data (from `ui-tests.yaml` → `PROJ-101`):**

| Data Set | Label | Username | Password | Expected URL Fragment |
|---|---|---|---|---|
| 1 | Standard user | `tomsmith` | `${ENC:...}` (encrypted) | `/secure` |
| 2 | Same user — repeat validation | `tomsmith` | `${ENC:...}` (encrypted) | `/secure` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/login.test.ts` |
| Test Group | `Login Feature Tests` |
| Function | `for (const ds of proj101Sets) { test('TC01: ...') }` |
| Page Object | `LoginPage` → `navigateToLoginPage()`, `login()`, `verifySuccessfulLogin()` |
| Data Loader | `getTestDataSets('ui-tests.yaml', 'PROJ-101')` |

---

### TC02: Wrong password should show an error message

| Field | Value |
|---|---|
| **Test Case ID** | TC02 |
| **XRAY Key** | PROJ-102 |
| **Priority** | High |
| **Type** | Negative |
| **Acceptance Criteria** | AC-2 |
| **Parameterized** | No — single data set |

**Preconditions:**
- Application is accessible at `BASE_URL`
- Valid username exists, but password is intentionally wrong

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the login page (`/login`) | Login page loads |
| 2 | Enter valid username with wrong password | Fields are populated |
| 3 | Click the Login button | Form is submitted |
| 4 | Verify error message "Your password is invalid!" is displayed | Flash error appears on page |
| 5 | Verify URL still contains `/login` | User is NOT redirected — stays on login page |

**Test Data (from `ui-tests.yaml` → `PROJ-102`):**

| Field | Value |
|---|---|
| Username | `tomsmith` |
| Password | `${ENC:...}` (wrong, encrypted) |
| Expected Error | `Your password is invalid!` |
| Expected URL | `/login` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/login.test.ts` |
| Function | `test('TC02: Wrong password should show an error message')` |
| Page Object | `LoginPage` → `login()`, `verifyLoginErrorMessage()` |
| Data Loader | `getTestData('ui-tests.yaml', 'PROJ-102')` |

---

### TC03: Empty credentials should show validation errors

| Field | Value |
|---|---|
| **Test Case ID** | TC03 |
| **XRAY Key** | PROJ-103 |
| **Priority** | Medium |
| **Type** | Negative / Boundary |
| **Acceptance Criteria** | AC-3 |
| **Parameterized** | No — single data set |

**Preconditions:**
- Application is accessible at `BASE_URL`

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the login page (`/login`) | Login page loads |
| 2 | Leave username and password fields empty | Fields remain blank |
| 3 | Click the Login button | Form submission attempted |
| 4 | Verify validation error "Your username is invalid!" is displayed | Flash error appears |
| 5 | Verify URL still contains `/login` | User stays on login page |

**Test Data (from `ui-tests.yaml` → `PROJ-103`):**

| Field | Value |
|---|---|
| Username | *(empty)* |
| Password | *(empty)* |
| Expected Error | `Your username is invalid!` |
| Expected URL | `/login` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/login.test.ts` |
| Function | `test('TC03: Empty credentials should show validation errors')` |
| Page Object | `LoginPage` → `navigateToLoginPage()`, `clickLoginButton()`, `verifyLoginErrorMessage()` |
| Data Loader | `getTestData('ui-tests.yaml', 'PROJ-103')` |

---

# ═══════════════════════════════════════════════════════════════════════════
# US-02: REST API VALIDATION
# ═══════════════════════════════════════════════════════════════════════════

## 📖 User Story US-02

> **As a** backend consumer / API client,
> **I want to** interact with REST API endpoints (GET, POST),
> **So that** I can retrieve data, create resources, and verify the API contract is correct.

**Acceptance Criteria:**
- ✅ AC-1: GET a single resource → returns 200 with correct fields and values
- ✅ AC-2: POST a new resource → returns 201 Created with echoed data + new ID
- ✅ AC-3: GET a user profile → returns 200 with nested objects (address, company)
- ✅ AC-4: Response times should be captured and logged

**Target API:** `https://jsonplaceholder.typicode.com` (public demo REST API)

---

### TC04: GET /posts/1 — Should return a valid blog post with correct fields

| Field | Value |
|---|---|
| **Test Case ID** | TC04 |
| **XRAY Key** | PROJ-104 |
| **Priority** | High |
| **Type** | Positive / Contract |
| **Acceptance Criteria** | AC-1, AC-4 |

**Preconditions:**
- JSONPlaceholder API is available
- Network connectivity from test runner

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Send `GET` request to `/posts/1` | HTTP response received |
| 2 | Validate HTTP status is `200` | Status code is 200 OK |
| 3 | Validate response body has fields: `id`, `userId`, `title`, `body` | All 4 fields present in JSON |
| 4 | Validate `id` equals `1` | ID matches requested resource |
| 5 | Validate `title` is a non-empty string | Title has content |
| 6 | Validate `body` is a non-empty string | Body has content |
| 7 | Log response duration in ms | Duration captured in report |

**Test Data (from `api-tests.yaml` → `PROJ-104`):**

| Field | Value |
|---|---|
| Base URL | `https://jsonplaceholder.typicode.com` |
| Endpoint | `/posts/1` |
| Method | `GET` |
| Expected Status | `200` |
| Expected Fields | `id`, `userId`, `title`, `body` |
| Expected ID | `1` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/api.test.ts` |
| Test Group | `API Feature Tests` |
| Function | `test('TC04: GET /posts/1 ...')` |
| API Helper | `apiGet<Record<string, unknown>>(url)` |
| Data Loader | `getTestDataSets('api-tests.yaml', 'PROJ-104')` |

---

### TC05: POST /posts — Should create a new post and return 201 Created

| Field | Value |
|---|---|
| **Test Case ID** | TC05 |
| **XRAY Key** | PROJ-105 |
| **Priority** | High |
| **Type** | Positive / Create |
| **Acceptance Criteria** | AC-2, AC-4 |

**Preconditions:**
- JSONPlaceholder API is available
- POST endpoint accepts JSON body

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Prepare JSON payload: `{ title, body, userId }` from YAML | Payload assembled |
| 2 | Send `POST` request to `/posts` with payload | HTTP response received |
| 3 | Validate HTTP status is `201` Created | Status is 201 (not 200) |
| 4 | Validate response `title` matches payload title | Server echoed data |
| 5 | Validate response `body` matches payload body | Server echoed data |
| 6 | Validate response `userId` matches payload userId | Server echoed data |
| 7 | Validate response has new `id > 0` assigned | Server created resource with ID |

**Test Data (from `api-tests.yaml` → `PROJ-105`):**

| Field | Value |
|---|---|
| Base URL | `https://jsonplaceholder.typicode.com` |
| Endpoint | `/posts` |
| Method | `POST` |
| Expected Status | `201` |
| Payload Title | `Demo Post Created by Playwright API Test` |
| Payload Body | `This post was created automatically by our test framework...` |
| Payload UserID | `1` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/api.test.ts` |
| Function | `test('TC05: POST /posts ...')` |
| API Helper | `apiPost<{id, title, body, userId}>(url, payload)` |
| Data Loader | `getTestDataSets('api-tests.yaml', 'PROJ-105')` |

---

### TC06: GET /users/1 — Should return a complete user profile with nested fields

| Field | Value |
|---|---|
| **Test Case ID** | TC06 |
| **XRAY Key** | PROJ-106 |
| **Priority** | High |
| **Type** | Positive / Deep Validation |
| **Acceptance Criteria** | AC-3, AC-4 |

**Preconditions:**
- JSONPlaceholder API is available

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Send `GET` request to `/users/1` | HTTP response received |
| 2 | Validate HTTP status is `200` | Status code is 200 OK |
| 3 | Validate top-level fields: `id`, `name`, `email`, `phone`, `website`, `address`, `company` | All 7 fields present |
| 4 | Validate `id` equals `1` | ID matches requested user |
| 5 | Validate `email` contains `@` | Email format is valid |
| 6 | Validate nested `address` has: `street`, `city`, `zipcode` | Nested address fields present |
| 7 | Validate nested `company` has: `name`, `catchPhrase` | Nested company fields present |

**Test Data (from `api-tests.yaml` → `PROJ-106`):**

| Field | Value |
|---|---|
| Base URL | `https://jsonplaceholder.typicode.com` |
| Endpoint | `/users/1` |
| Method | `GET` |
| Expected Status | `200` |
| Expected Fields | `id`, `name`, `email`, `phone`, `website`, `address`, `company` |
| Expected ID | `1` |
| Email Contains | `@` |
| Address Fields | `street`, `city`, `zipcode` |
| Company Fields | `name`, `catchPhrase` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/api.test.ts` |
| Function | `test('TC06: GET /users/1 ...')` |
| API Helper | `apiGet<Record<string, unknown>>(url)` |
| Data Loader | `getTestDataSets('api-tests.yaml', 'PROJ-106')` |

---

# ═══════════════════════════════════════════════════════════════════════════
# US-03: SITE NAVIGATION
# ═══════════════════════════════════════════════════════════════════════════

## 📖 User Story US-03

> **As a** website visitor,
> **I want to** navigate between different sections of the site using the navigation bar,
> **So that** I can access documentation, API references, and community resources.

**Acceptance Criteria:**
- ✅ AC-1: Homepage loads with correct title and heading
- ✅ AC-2: Clicking "Docs" tab navigates to Installation page
- ✅ AC-3: Clicking "API" tab navigates to Playwright Library page
- ✅ AC-4: Clicking "Community" tab navigates to Welcome page
- ✅ AC-5: Switching language to Python navigates to the Python docs

**Target Site:** `https://playwright.dev/`

---

### TC07: Navigate to Homepage and verify Playwright title

| Field | Value |
|---|---|
| **Test Case ID** | TC07 |
| **XRAY Key** | PROJ-107 |
| **Priority** | Critical (Smoke Test) |
| **Type** | Positive / Smoke |
| **Acceptance Criteria** | AC-1 |

**Preconditions:**
- `https://playwright.dev/` is accessible

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to `https://playwright.dev/` | Page loads completely |
| 2 | Verify page title contains `Playwright` | Title matches |
| 3 | Verify homepage heading text is `Playwright enables reliable end-to-end testing` | Heading matches |
| 4 | Verify URL contains `playwright.dev` | URL is correct |

**Test Data (from `ui-tests.yaml` → `PROJ-107`):**

| Field | Value |
|---|---|
| Expected Title | `Playwright` |
| Expected Heading | `Playwright enables reliable end-to-end testing` |
| Expected URL | `playwright.dev` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/playwright-dev.test.ts` |
| Test Group | `Playwright.dev Navigation Tests` |
| Function | `test('TC07: Navigate to Homepage ...')` |
| Page Object | `PlaywrightDevPage` → `navigateToHomePage()`, `verifyPageTitle()`, `verifyHeadingText()`, `verifyUrl()` |

---

### TC08: Click Docs tab and verify Installation page title

| Field | Value |
|---|---|
| **Test Case ID** | TC08 |
| **XRAY Key** | PROJ-108 |
| **Priority** | High |
| **Type** | Positive / Navigation |
| **Acceptance Criteria** | AC-2 |

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the homepage | Homepage loads |
| 2 | Click the "Docs" tab in the navigation bar | Page navigates |
| 3 | Verify page title contains `Installation` | Title matches |
| 4 | Verify heading text is `Installation` | Heading matches |
| 5 | Verify URL contains `/docs/intro` | URL is correct |

**Test Data (from `ui-tests.yaml` → `PROJ-108`):**

| Field | Value |
|---|---|
| Expected Title | `Installation` |
| Expected Heading | `Installation` |
| Expected URL | `/docs/intro` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/playwright-dev.test.ts` |
| Function | `test('TC08: Click Docs tab ...')` |
| Page Object | `PlaywrightDevPage` → `navigateToHomePage()`, `clickDocsTab()`, `verifyPageTitle()`, `verifyHeadingText()`, `verifyUrl()` |

---

### TC09: Click API tab and verify Playwright Library page title

| Field | Value |
|---|---|
| **Test Case ID** | TC09 |
| **XRAY Key** | PROJ-109 |
| **Priority** | High |
| **Type** | Positive / Navigation |
| **Acceptance Criteria** | AC-3 |

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the homepage | Homepage loads |
| 2 | Click the "API" tab in the navigation bar | Page navigates |
| 3 | Verify page title contains `Playwright Library` | Title matches |
| 4 | Verify heading text is `Playwright Library` | Heading matches |
| 5 | Verify URL contains `/docs/api/class-playwright` | URL is correct |

**Test Data (from `ui-tests.yaml` → `PROJ-109`):**

| Field | Value |
|---|---|
| Expected Title | `Playwright Library` |
| Expected Heading | `Playwright Library` |
| Expected URL | `/docs/api/class-playwright` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/playwright-dev.test.ts` |
| Function | `test('TC09: Click API tab ...')` |
| Page Object | `PlaywrightDevPage` → `clickApiTab()` |

---

### TC10: Click Community tab and verify Welcome page title

| Field | Value |
|---|---|
| **Test Case ID** | TC10 |
| **XRAY Key** | PROJ-110 |
| **Priority** | Medium |
| **Type** | Positive / Navigation |
| **Acceptance Criteria** | AC-4 |

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the homepage | Homepage loads |
| 2 | Click the "Community" tab in the navigation bar | Page navigates |
| 3 | Verify page title contains `Welcome` | Title matches |
| 4 | Verify heading text is `Welcome` | Heading matches |
| 5 | Verify URL contains `/community/welcome` | URL is correct |

**Test Data (from `ui-tests.yaml` → `PROJ-110`):**

| Field | Value |
|---|---|
| Expected Title | `Welcome` |
| Expected Heading | `Welcome` |
| Expected URL | `/community/welcome` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/playwright-dev.test.ts` |
| Function | `test('TC10: Click Community tab ...')` |
| Page Object | `PlaywrightDevPage` → `clickCommunityTab()` |

---

### TC11: Switch to Python language and verify Python page title

| Field | Value |
|---|---|
| **Test Case ID** | TC11 |
| **XRAY Key** | PROJ-111 |
| **Priority** | Medium |
| **Type** | Positive / UI Interaction (Dropdown) |
| **Acceptance Criteria** | AC-5 |

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the homepage | Homepage loads |
| 2 | Open the language dropdown and select "Python" | Dropdown opens, Python selected |
| 3 | Verify page title contains `Playwright Python` | Title matches |
| 4 | Verify URL contains `/python/` | URL is correct |

**Test Data (from `ui-tests.yaml` → `PROJ-111`):**

| Field | Value |
|---|---|
| Expected Title | `Playwright Python` |
| Expected Heading | *(not checked — Python page has different layout)* |
| Expected URL | `/python/` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/playwright-dev.test.ts` |
| Function | `test('TC11: Switch to Python ...')` |
| Page Object | `PlaywrightDevPage` → `switchToPython()` |

---

# ═══════════════════════════════════════════════════════════════════════════
# US-04: IFRAME INTERACTION
# ═══════════════════════════════════════════════════════════════════════════

## 📖 User Story US-04

> **As a** tester working with enterprise applications (Salesforce, ServiceNow, Workday),
> **I want to** interact with form fields embedded inside iframes,
> **So that** I can automate data entry and verification on complex record pages that use nested iframe architectures.

**Acceptance Criteria:**
- ✅ AC-1: Fill multiple form fields inside a single iframe and verify values
- ✅ AC-2: Fill form fields across two separate iframes on the same page
- ✅ AC-3: Click buttons and verify messages inside iframes
- ✅ AC-4: Switch between iframes without manual frame switching
- ✅ AC-5: Access main-page elements after iframe interactions (no "stuck in frame" issue)

**Target:** Self-hosted HTML fixture (`test-fixtures/iframe-form.html`) — two iframes simulating a Salesforce Lead + Contact record page.

---

### TC12: Iframe — fill multiple form fields inside a single iframe

| Field | Value |
|---|---|
| **Test Case ID** | TC12 |
| **XRAY Key** | PROJ-112 |
| **Priority** | High |
| **Type** | Positive / Iframe — Single Frame |
| **Acceptance Criteria** | AC-1, AC-5 |

**Preconditions:**
- Local HTML fixture (`test-fixtures/iframe-form.html`) is accessible
- Fixture contains iframe `#lead-iframe` with form fields

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the iframe fixture page | Page loads with title "Salesforce-Style Iframe Demo" |
| 2 | Verify main-page heading (outside iframe) | Heading matches `Salesforce-Style Iframe Demo` |
| 3 | Get iframe handle for `#lead-iframe` | Frame handle obtained |
| 4 | Verify First Name field is visible inside iframe | Field is visible and interactable |
| 5 | Fill 7 fields inside Lead iframe: First Name, Last Name, Company, Email, Phone, Description, Lead Status | All fields populated |
| 6 | Read back field values and verify they match input data | `firstName=John`, `lastName=Doe`, `company=Acme Corp`, `email=john.doe@acme.com`, `phone=+1-555-0199` |
| 7 | Verify main-page heading is still accessible (no frame switch needed) | Main page elements accessible without explicit switch-back |

**Test Data (from `ui-tests.yaml` → `PROJ-112`):**

| Field | Value |
|---|---|
| Page Title | `Salesforce-Style Iframe Demo` |
| Lead Iframe | `#lead-iframe` |
| First Name | `John` |
| Last Name | `Doe` |
| Company | `Acme Corp` |
| Email | `john.doe@acme.com` |
| Phone | `+1-555-0199` |
| Lead Status | `Working` |
| Description | `High-priority lead created by Playwright AutoAgent` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/salesforce-iframe.test.ts` |
| Test Group | `Salesforce-Style Iframe Tests` |
| Function | `test('TC12: Iframe — fill multiple form fields ...')` |
| Page Object | `BasePage` → `getIframe()`, `fillInIframe()`, `selectInIframe()`, `getIframeFieldValue()`, `assertVisibleInIframe()` |
| Data Loader | `getTestDataSets('ui-tests.yaml', 'PROJ-112')` |

---

### TC13: Iframe — fill fields across TWO iframes and verify

| Field | Value |
|---|---|
| **Test Case ID** | TC13 |
| **XRAY Key** | PROJ-113 |
| **Priority** | High |
| **Type** | Positive / Iframe — Multi-Frame |
| **Acceptance Criteria** | AC-1, AC-2, AC-3, AC-4, AC-5 |

**Preconditions:**
- Local HTML fixture contains two iframes: `#lead-iframe` and `#contact-iframe`
- Contact iframe has a Save button and success message element

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the iframe fixture page | Page loads |
| 2 | Get frame handles for BOTH `#lead-iframe` and `#contact-iframe` | Two separate frame handles obtained |
| 3 | Fill lead fields in iframe #1: First Name, Last Name, Company | Fields populated in Lead iframe |
| 4 | Fill contact fields in iframe #2: Street, City, State, Zip, Website, Country | Fields populated in Contact iframe |
| 5 | Click "Save" button inside iframe #2 | Button clicked inside Contact iframe |
| 6 | Verify success message "Contact saved successfully" in iframe #2 | Message appears inside iframe |
| 7 | Jump back to iframe #1 — verify lead fields still populated | `firstName=Jane`, `company=Global Tech Inc` still present |
| 8 | Verify main-page heading (outside all iframes) | Main page accessible without explicit switch-back |

**Test Data (from `ui-tests.yaml` → `PROJ-113`):**

| Field | Value |
|---|---|
| Page Title | `Salesforce-Style Iframe Demo` |
| Lead Iframe | `#lead-iframe` |
| Contact Iframe | `#contact-iframe` |
| First Name | `Jane` |
| Last Name | `Smith` |
| Company | `Global Tech Inc` |
| Street | `123 Market Street` |
| City | `San Francisco` |
| State | `CA` |
| Zip | `94105` |
| Country | `United States` |
| Website | `https://globaltech.example.com` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/salesforce-iframe.test.ts` |
| Function | `test('TC13: Iframe — fill fields across TWO iframes ...')` |
| Page Object | `BasePage` → `getIframe()`, `fillInIframe()`, `selectInIframe()`, `clickInIframe()`, `assertTextInIframe()`, `getIframeFieldValue()` |
| Data Loader | `getTestDataSets('ui-tests.yaml', 'PROJ-113')` |

---

# ═══════════════════════════════════════════════════════════════════════════
# CROSS-CUTTING CONCERNS (Applied to ALL Tests)
# ═══════════════════════════════════════════════════════════════════════════

The following capabilities are automatically applied to **every test** in the framework — no extra code needed:

| Concern | How It Works | Applies To |
|---|---|---|
| **JIRA XRAY Reporting** | `annotation: { type: 'xray', description: 'PROJ-XXX' }` → result auto-uploaded | All 13 test cases |
| **Accessibility Scan** | axe-core runs automatically after every UI test | TC01–TC03, TC07–TC13 |
| **Screenshot on Failure** | Captured automatically when any assertion fails | All 13 test cases |
| **HTML Execution Report** | Generated in `reports/execution-report-*.html` with charts | All 14 executions |
| **Enhanced Logging** | Every `enhancedLogger.step()` appears in the report | All 14 executions |
| **Data-Driven YAML** | All test data externalized — change YAML, not code | All 13 test cases |
| **Password Encryption** | `${ENC:...}` auto-decrypted at runtime via `ENCRYPTION_KEY` | TC01, TC02 |
| **Parameterized Testing** | `dataSets:` array in YAML → one run per data set | TC01 (2 sets) |
| **Feature Toggles** | `.frameworkrc` enables/disables XRAY, DB, email, a11y | Framework-wide |
| **Response Timing** | API calls log `durationMs` in the report | TC04, TC05, TC06 |

---

# ═══════════════════════════════════════════════════════════════════════════
# FULL TRACEABILITY MATRIX
# ═══════════════════════════════════════════════════════════════════════════

| User Story | AC | TC | XRAY Key | Test Script | Data File | Page Object | Type |
|---|---|---|---|---|---|---|---|
| US-01 Auth | AC-1 | TC01 | PROJ-101 | `login.test.ts` | `ui-tests.yaml` | `LoginPage` | Positive ×2 |
| US-01 Auth | AC-2 | TC02 | PROJ-102 | `login.test.ts` | `ui-tests.yaml` | `LoginPage` | Negative |
| US-01 Auth | AC-3 | TC03 | PROJ-103 | `login.test.ts` | `ui-tests.yaml` | `LoginPage` | Negative |
| US-02 API | AC-1 | TC04 | PROJ-104 | `api.test.ts` | `api-tests.yaml` | — | GET |
| US-02 API | AC-2 | TC05 | PROJ-105 | `api.test.ts` | `api-tests.yaml` | — | POST |
| US-02 API | AC-3 | TC06 | PROJ-106 | `api.test.ts` | `api-tests.yaml` | — | GET (nested) |
| US-03 Nav | AC-1 | TC07 | PROJ-107 | `playwright-dev.test.ts` | `ui-tests.yaml` | `PlaywrightDevPage` | Smoke |
| US-03 Nav | AC-2 | TC08 | PROJ-108 | `playwright-dev.test.ts` | `ui-tests.yaml` | `PlaywrightDevPage` | Navigation |
| US-03 Nav | AC-3 | TC09 | PROJ-109 | `playwright-dev.test.ts` | `ui-tests.yaml` | `PlaywrightDevPage` | Navigation |
| US-03 Nav | AC-4 | TC10 | PROJ-110 | `playwright-dev.test.ts` | `ui-tests.yaml` | `PlaywrightDevPage` | Navigation |
| US-03 Nav | AC-5 | TC11 | PROJ-111 | `playwright-dev.test.ts` | `ui-tests.yaml` | `PlaywrightDevPage` | Dropdown |
| US-04 Iframe | AC-1 | TC12 | PROJ-112 | `salesforce-iframe.test.ts` | `ui-tests.yaml` | `BasePage` | Iframe |
| US-04 Iframe | AC-2–5 | TC13 | PROJ-113 | `salesforce-iframe.test.ts` | `ui-tests.yaml` | `BasePage` | Multi-Iframe |

---

# ═══════════════════════════════════════════════════════════════════════════
# HOW TO ADD A NEW USER STORY + TEST CASE
# ═══════════════════════════════════════════════════════════════════════════

```
Step 1: Write the User Story
  ┌──────────────────────────────────────────────────────────────────┐
  │  US-05: As a [role], I want to [action], so that [benefit].      │
  │  AC-1: [specific acceptance criterion]                           │
  │  AC-2: [another criterion]                                      │
  └──────────────────────────────────────────────────────────────────┘

Step 2: Define Test Cases (in this document)
  ┌──────────────────────────────────────────────────────────────────┐
  │  TC14: [Description]                                             │
  │  Steps:  1. ...  2. ...  3. ...                                  │
  │  Expected: [what should happen]                                  │
  │  XRAY Key: PROJ-114                                              │
  └──────────────────────────────────────────────────────────────────┘

Step 3: Add Test Data to YAML
  ┌──────────────────────────────────────────────────────────────────┐
  │  # test-data/ui-tests.yaml                                       │
  │  PROJ-114:                                                       │
  │    run: yes                                                      │
  │    testCase: "TC14: My new test description"                     │
  │    field1: "value1"                                              │
  │    field2: "value2"                                              │
  └──────────────────────────────────────────────────────────────────┘

Step 4: Write the Test Script
  ┌──────────────────────────────────────────────────────────────────┐
  │  // tests/my-feature.test.ts                                     │
  │  test('TC14: My new test', { annotation: ... }, async () => {   │
  │    const td = getTestData('ui-tests.yaml', 'PROJ-114');          │
  │    // your steps here                                            │
  │  });                                                             │
  └──────────────────────────────────────────────────────────────────┘

Step 5: Update the Traceability Matrix (above)
  Add a new row linking US → AC → TC → XRAY → Script → Data → POM
```

---

*Last updated: 13 March 2026*
*Framework: Playwright AutoAgent – AI Automation Framework*
*Tests: 3 Login (UI; TC01 ×2 data sets) + 3 API (REST) + 5 Navigation (UI) + 2 Iframe (UI) = 14 total executions*

# ═══════════════════════════════════════════════════════════════════════════
# US-05: SEARCH FUNCTIONALITY (AUTO-GENERATED)
# ═══════════════════════════════════════════════════════════════════════════

## 📖 User Story US-05

> As a user, I want to search for content on the website, so that I can quickly find relevant information without manually browsing.

**Priority:** High  
**Module:** Search  
**Target:** `https://playwright.dev`  

**Acceptance Criteria:**
- ✅ AC-1: Search for a valid keyword and verify results appear
- ✅ AC-2: Search for an empty string should show no results or prompt
- ✅ AC-3: Search for a nonsense keyword should show no results

---

### TC14: Search for a valid keyword and verify results appear

| Field | Value |
|---|---|
| **Test Case ID** | TC14 |
| **XRAY Key** | PROJ-201 |
| **Priority** | High |
| **Type** | Positive |

**Preconditions:**
- Website is accessible
- Search functionality is available on the page

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the documentation page | Docs page loads with search icon visible |
| 2 | Click the search icon / press Ctrl+K to open search | Search modal opens with input field focused |
| 3 | Type 'locator' into the search field | Search results appear showing matches |
| 4 | Verify at least one result contains the keyword | Results list has items matching 'locator' |

**Test Data:**

| Field | Value |
|---|---|
| searchKeyword | `locator` |
| expectedMinResults | `1` |
| expectedUrlFragment | `/docs` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/search.test.ts` |
| Page Object | `SearchPage` |
| Data File | `test-data/search-tests.yaml` |
| XRAY Key | `PROJ-201` |

---

### TC15: Search for an empty string should show no results or prompt

| Field | Value |
|---|---|
| **Test Case ID** | TC15 |
| **XRAY Key** | PROJ-202 |
| **Priority** | Medium |
| **Type** | Negative |

**Preconditions:**
- Website is accessible
- Search modal can be opened

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the documentation page | Docs page loads |
| 2 | Open the search modal | Search modal opens |
| 3 | Submit search with empty input | No results shown or a helpful prompt is displayed |

**Test Data:**

| Field | Value |
|---|---|
| searchKeyword | `` |
| expectedMinResults | `0` |
| expectedUrlFragment | `/docs` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/search.test.ts` |
| Page Object | `SearchPage` |
| Data File | `test-data/search-tests.yaml` |
| XRAY Key | `PROJ-202` |

---

### TC16: Search for a nonsense keyword should show no results

| Field | Value |
|---|---|
| **Test Case ID** | TC16 |
| **XRAY Key** | PROJ-203 |
| **Priority** | Medium |
| **Type** | Negative |

**Preconditions:**
- Website is accessible

**Test Steps:**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to the documentation page | Docs page loads |
| 2 | Open the search modal | Search modal opens |
| 3 | Type 'xyzzynonexistent99' into the search field | No results found message is displayed |

**Test Data:**

| Field | Value |
|---|---|
| searchKeyword | `xyzzynonexistent99` |
| expectedMinResults | `0` |
| expectedNoResultsMessage | `No results` |
| expectedUrlFragment | `/docs` |

**Script Mapping:**

| Attribute | Value |
|---|---|
| Test File | `tests/search.test.ts` |
| Page Object | `SearchPage` |
| Data File | `test-data/search-tests.yaml` |
| XRAY Key | `PROJ-203` |

---