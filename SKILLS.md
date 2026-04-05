# 🤖 SKILLS.md — Agentic AI QE Process (Master Instruction File)

> **⚡ THIS IS THE MASTER INSTRUCTION FILE FOR THE AI AGENT.**  
> Always read this file first before performing any task in this project.  
> It defines the complete end-to-end QE automation process.

This document defines the **capabilities and workflows** for agentic automation in the Playwright AgentsAI Demo framework.

## 🔑 Two-Command Architecture

| # | Command | Purpose |
|---|---------|--------|
| 1 | `npm run generate -- <story-name>` | **User Story → Manual Test Cases → Playwright Script** (+ Page Object for Web) |
| 2 | `npm run test:report` | **Run all tests → Generate beautiful HTML report** |

> The entire QE flow is driven by these 2 commands + YAML data files.
> The AI agent follows SKILLS.md to orchestrate the process autonomously.

---

## 🎯 Agent Capabilities

The agent can autonomously perform the following tasks:

### 1. **Parse & Understand User Stories** 
- Read BDD YAML files from `user-stories/`
- Extract acceptance criteria (Given/When/Then)
- Understand test types (Web vs API)
- Identify required data fields

### 2. **Generate Test Artifacts**
- Create manual test case markdown with BDD scenario tables
- Generate fully-typed TypeScript test scripts with proper imports
- Create Page Objects with real locators (Web only)
- Implement test logic from acceptance criteria
- Support both UI and API testing patterns

### 3. **Implement Test Logic**
- Navigate to pages (Web) or call APIs
- Perform user actions (fill forms, click buttons)
- Make HTTP requests with proper payloads
- Extract and validate responses
- Add assertions based on expected outcomes
- Log steps using `enhancedLogger`

### 4. **Data-Driven Testing**
- Load test data from YAML files
- Check `run: true/false` flags
- Filter by tags (Smoke, Sanity, Regression)
- Handle encrypted values (`${ENC:...}`)
- Handle environment variables (`${ENV:...}`)
- Support dynamic test parametrization

### 5. **Generate Beautiful Reports**
- Read Playwright JSON results
- Merge test data with execution results
- Generate single-file HTML with embedded charts
- Create BDD step-by-step documentation
- Display performance, accessibility, security metrics
- Build custom story-to-test-case mappings

### 6. **Handle Failures Gracefully**
- Check for test data existence before running
- Skip tests when `run: false`
- Capture screenshots on failure
- Log detailed error messages
- Generate accessibility violation reports
- Track performance bottlenecks

---

## 🔄 Agent Workflows

### Workflow A: Generate from User Story
**Command:** `npm run generate -- US-101-login`

```
┌─────────────────────────────────────┐
│ 1. Read user-stories/US-101-*.yaml  │
│    Parse: storyId, title, type, ACs │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 2. Generate Manual Test Cases       │
│    → manual-test-cases/US-101-*.md  │
│    Table: AC | Given | When | Then  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 3. Generate Test Script             │
│    → tests/us-101.test.ts           │
│    - test.describe()                │
│    - Import statements              │
│    - loadTestEntry() calls          │
│    - Step logging                   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 4. Generate Page Object (Web only)  │
│    → pages/<Module>Page.ts          │
│    - Extend BasePage                │
│    - Add locators for selectors     │
│    - Implement action methods       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 5. Prompt for next steps            │
│    - Add data to test-data/*.yaml   │
│    - Implement TODOs                │
│    - Run tests                      │
└─────────────────────────────────────┘
```

### Workflow B: Run Tests & Generate Report

**Command:** `npm run test:report`
_(or separately: `npx playwright test` then `npm run report`)_

```
┌─────────────────────────────────────┐
│ 1. Run all tests in tests/          │
│    - Load test data                 │
│    - Check run flags                │
│    - Execute tests                  │
│    - Capture logs & perf data       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 2. Collect Results                  │
│    - JSON reporter output           │
│    - Enhanced logger data           │
│    - Accessibility violations       │
│    - Performance metrics            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 3. Merge Data Sources               │
│    - User stories (storyId mapping) │
│    - Test data (tags, titles)       │
│    - Playwright results (status)    │
│    - Logger entries (steps)         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 4. Generate HTML Report             │
│    → reports/autoagent-report-*.html│
│    - Dashboard (pass/fail/skip)     │
│    - Charts (4 different views)     │
│    - BDD acceptance criteria        │
│    - Performance & security cards   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 5. Output Path                      │
│    Ready for customer demo!         │
└─────────────────────────────────────┘
```

---

## 🛠️ Agent Implementation Tasks

### Task 1: Create/Update User Story YAML
**Input:** Customer description + acceptance criteria  
**Output:** `user-stories/US-XXX-name.yaml`

```typescript
// Agent checks:
✓ storyId format: US-\d{3}
✓ type: "Web" or "API"
✓ acceptanceCriteria[].scenario has given/when/then arrays
✓ All fields present (storyId, title, type, description, priority, module, baseUrl, pagePath/endpoint)
```

### Task 2: Create Test Data Entry
**Input:** User story file + test data from customer  
**Output:** Entry in `test-data/web-tests.yaml` or `api-tests.yaml`

```typescript
// Agent creates entry with key format: US-XXX.AC-Y
// Fields added:
✓ run: true (enable execution)
✓ tags: ["Smoke", "Regression"] (for filtering)
✓ All data fields needed by test script
✓ Handles arrays (for POST payloads) and objects (for nested fields)
```

### Task 3: Implement Generated Test Script
**Input:** Generated `tests/us-xxx.test.ts` with TODOs  
**Output:** Fully functional test script

```typescript
// Agent fills in TODOs by:
✓ Analyzing acceptance criteria steps
✓ Visiting actual website/API to learn selectors
✓ Creating page methods matching steps
✓ Adding proper assertions
✓ Using enhancedLogger.step() for documentation
```

### Task 4: Verify Test Data Completeness
**Input:** Generated test script + test data file  
**Output:** Validation report

```typescript
// Agent verifies:
✓ All US-XXX.AC-Y keys exist in data file
✓ All referenced fields in script exist in data
✓ run: true/false is set appropriately
✓ tags are one of: [Smoke, Sanity, Regression]
```

### Task 5: Run Tests & Generate Report
**Input:** Test scripts + test data + user stories  
**Output:** Execution report + metrics

```typescript
// Agent orchestrates:
✓ Runs: npx playwright test
✓ Generates: npm run report
✓ Validates: All 6 test results match expectations
✓ Outputs: Beautiful HTML at reports/autoagent-report-*.html
```

---

## 📋 Decision Trees for Agent

### Decision: Should test run?
```
IF test-data[key].run == true
  AND test-data[key] exists
  THEN execute test
ELSE skip test
```

### Decision: Which data file?
```
IF user-story.type == "Web"
  THEN use test-data/web-tests.yaml
ELSE (API)
  THEN use test-data/api-tests.yaml
```

### Decision: Generate Page Object?
```
IF user-story.type == "Web"
  THEN create pages/<Module>Page.ts
ELSE (API)
  THEN skip page object (no UI)
```

### Decision: Test passed or failed?
```
IF all expect() assertions passed
  AND no errors thrown
  THEN status = "passed"
ELSE
  THEN status = "failed"
  AND capture screenshot
  AND log error message
```

---

## 🔌 Agent Integration Points

### With Playwright
- Use `@playwright/test` for test definitions
- Use `page` fixture for Web tests
- Use `request` fixture for API tests
- Use `expect()` for assertions
- Import from `../utils/framework/xray-test-fixture`

### With Data Layer
- Always call `loadTestEntry(dataFile, key)` at test start
- Check `td.run` and skip if false
- Access all data fields as `td.fieldName`
- Supports type coercion with `as` keyword

### With Logging
- Call `enhancedLogger.section()` at test start
- Call `enhancedLogger.step()` for each test action
- Call `enhancedLogger.pass()` on success
- Call `enhancedLogger.fail()` on assertion failure (auto-done)

### With Page Objects
- Extend `BasePage` for all page objects
- Define locators as `this.page.locator(selector)`
- Create action methods that wrap playwright calls
- Use `await this.page.goto()` to navigate

---

## 🎓 Agent Learning Resources

### Understanding the Codebase
1. **Entry Point:** `scripts/generate-from-stories.ts` (Command 1)
2. **Report Gen:** `scripts/generate-report.ts` (Command 2)
3. **Test Fixture:** `utils/framework/xray-test-fixture.ts` (how tests are wrapped)
4. **Data Loader:** `utils/helpers/test-data-loader.ts` (how data is loaded)
5. **Base Page:** `pages/BasePage.ts` (all pages inherit from this)

### Understanding Test Execution
1. `playwright.config.ts` defines test runner settings
2. Global setup runs first: `utils/framework/global-setup.ts`
3. Each test runs with custom fixture providing `xrayTestKey`
4. Global teardown runs last: `utils/framework/global-teardown.ts`
5. Results saved to `test-results/results.json`

### Understanding Report Generation
1. Script reads all user stories from `user-stories/`
2. Script reads all test data from `test-data/`
3. Script reads Playwright JSON results
4. Script merges all 3 sources
5. Script generates single HTML file with embedded styles & charts

---

## 🚀 Quick Commands for Agent

```bash
# COMMAND 1: Generate from a user story (US → Manual TC → Script)
npm run generate -- US-101-login

# COMMAND 2: Run tests + generate report (single command)
npm run test:report

# Or run tests and report separately:
npx playwright test
npm run report

# Run specific test file
npx playwright test tests/us-101.test.ts

# Run with debug
npx playwright test --debug

# View Playwright HTML report
npx playwright show-report

# Type check (no build needed)
npm run lint

# Clean artifacts
npm run clean
```

---

## 📞 When Agent Needs Help

### Stuck on selectors?
→ Use `npx playwright test --debug` to open inspector and inspect live page

### Uncertain about test data?
→ Check `test-data/web-tests.yaml` for examples, use same format

### Test failing mysteriously?
→ Add `enhancedLogger.info(JSON.stringify(variable))` to log internals

### Need to modify test?
→ Edit the test file directly, rerun `npx playwright test`

### Want to see all available stories?
→ Run `npm run generate` with no arguments to list them

---

**Version:** 1.0  
**Last Updated:** April 5, 2026  
**Framework:** Playwright AgentsAI Demo
