# 🤖 AI-Assisted Test Validation — Approach Document

### How to Use Playwright MCP, Playwright CLI, and Premium AI Models
### to Validate This Project (Written for Novices)

---

> **Who is this for?**
> You are a QA engineer (any experience level) who wants to use AI tools —
> Claude Opus 4.6, OpenAI o3/Codex, or similar models — to help you
> explore, validate, debug, and even write tests for this Playwright project.
>
> **You do NOT need to be an AI expert.** This document shows you exactly
> what to type and what to expect.

---

## 📚 Table of Contents

1. [The Big Picture — What Are These Tools?](#the-big-picture)
2. [Three Ways AI Can Help You Test](#three-ways-ai-can-help-you-test)
3. [Approach 1: Playwright MCP + AI Chat (Recommended)](#approach-1--playwright-mcp--ai-chat)
4. [Approach 2: Playwright CLI + AI for Analysis](#approach-2--playwright-cli--ai-for-analysis)
5. [Approach 3: AI Code Generation (Write Tests for You)](#approach-3--ai-code-generation)
6. [Setup Guide — Step by Step](#setup-guide)
7. [Real Prompts You Can Copy-Paste](#real-prompts-you-can-copy-paste)
8. [Model Comparison — Which AI to Use When](#model-comparison)
9. [Workflow Examples (End to End)](#workflow-examples)
10. [Limitations and Gotchas](#limitations-and-gotchas)
11. [Glossary](#glossary)

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   YOUR PROJECT                    AI TOOLS                          │
│   (This repo)                     (Your assistants)                 │
│                                                                     │
│   tests/                          ┌──────────────────────┐          │
│     login.test.ts  ◄──────────────│  Claude Opus 4.6     │          │
│     api.test.ts    ◄──────────────│  OpenAI o3 / Codex   │          │
│   pages/                          │  GitHub Copilot      │          │
│     LoginPage.ts                  └──────┬───────────────┘          │
│   utils/                                 │                          │
│     ...                                  │ talks to                 │
│                                          ▼                          │
│   ┌──────────────────┐    ┌──────────────────────────┐              │
│   │  Playwright CLI   │    │  Playwright MCP Server    │             │
│   │  (you run in      │    │  (AI controls the browser │             │
│   │   terminal)       │    │   directly for you)       │             │
│   └──────────────────┘    └──────────────────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### In Plain English

| Tool | What It Does | Analogy |
|------|-------------|---------|
| **Playwright CLI** | You run test commands in the terminal. Playwright opens a browser, runs the test, and gives you PASS/FAIL. | A driver who follows exact directions you wrote down |
| **Playwright MCP** | An AI model (Claude, Copilot, etc.) controls a live browser in real-time — clicking, typing, reading the page — using structured data (not screenshots). | A driver who can see the road and make decisions |
| **Claude Opus 4.6** | Anthropic's premium AI model. Excels at code generation, debugging, and understanding complex projects. | A senior developer sitting next to you |
| **OpenAI o3 / Codex** | OpenAI's premium models. Codex specializes in code tasks; o3 excels at reasoning through multi-step problems. | A senior developer who thinks step-by-step |

---

## Three Ways AI Can Help You Test

```
                     AI-Assisted Testing
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌─────────────┐ ┌───────────┐ ┌──────────────┐
     │  APPROACH 1  │ │ APPROACH 2│ │  APPROACH 3   │
     │  MCP + Chat  │ │ CLI + AI  │ │ AI Generates  │
     │              │ │ Analysis  │ │ Tests for You │
     │  AI drives   │ │ You drive │ │ AI writes,    │
     │  the browser │ │ AI reads  │ │ you review    │
     │  live        │ │ results   │ │ and run       │
     └─────────────┘ └───────────┘ └──────────────┘
       Best for:       Best for:      Best for:
       Exploration     Debugging      New test
       & validation    & analysis     creation
```

---

## Approach 1 — Playwright MCP + AI Chat

### What Is This?

**Playwright MCP** (Model Context Protocol) is an official Microsoft server that lets
AI models control a real browser — clicking buttons, filling forms, reading page content —
without needing screenshots or vision models.

The AI reads the page via **accessibility snapshots** (structured data like
"there's a button labeled 'Login' at ref=btn-3") instead of looking at images.

### When to Use This

| Scenario | Why MCP is Perfect |
|----------|-------------------|
| **Exploratory testing** | AI navigates your app and finds issues you might miss |
| **Visual validation** | "Does the login page look right? Are all fields present?" |
| **Accessibility checks** | MCP uses accessibility tree — it naturally finds a11y issues |
| **Regression sanity** | "Go to the app, log in, verify the dashboard loads" |
| **Form testing** | AI fills forms with edge cases (long strings, special chars, empty fields) |

### How It Works (Step by Step)

```
YOU (in VS Code / Claude Desktop / Cursor):
  "Go to https://the-internet.herokuapp.com/login,
   type 'tomsmith' as username and 'SuperSecretPassword!' as password,
   click Login, and tell me what you see."

         │
         ▼

AI + Playwright MCP:
  1. browser_navigate → opens the URL
  2. browser_snapshot → reads the page structure
  3. browser_type    → types username into the Username field
  4. browser_type    → types password into the Password field
  5. browser_click   → clicks the Login button
  6. browser_snapshot → reads the new page
  7. Returns: "Login successful. The page shows 'You logged into
     a secure area!' and the URL changed to /secure."

         │
         ▼

YOU: "Now try with wrong password 'abc123'"

AI + Playwright MCP:
  1. browser_navigate → goes back to /login
  2. browser_fill_form → fills both fields
  3. browser_click → clicks Login
  4. browser_snapshot → reads result
  5. Returns: "Login failed. Error message shows:
     'Your password is invalid!' URL stayed at /login."
```

### Available MCP Tools

These are the tools the AI can use when Playwright MCP is connected:

| MCP Tool | What It Does | Example Use |
|----------|-------------|-------------|
| `browser_navigate` | Go to a URL | Open login page |
| `browser_snapshot` | Read the full page structure (accessibility tree) | "What's on this page?" |
| `browser_click` | Click any element | Click "Login" button |
| `browser_type` | Type into a field | Enter username |
| `browser_fill_form` | Fill multiple fields at once | Fill entire login form |
| `browser_hover` | Hover over an element | Check tooltip text |
| `browser_select_option` | Pick from a dropdown | Select a country |
| `browser_press_key` | Press a keyboard key | Press Enter, Escape, Tab |
| `browser_take_screenshot` | Capture a visual screenshot | Save proof of a bug |
| `browser_console_messages` | Read browser console errors | Check for JS errors |
| `browser_network_requests` | See all API calls the page made | Verify backend calls |
| `browser_tabs` | Open/close/switch browser tabs | Test multi-tab flows |
| `browser_evaluate` | Run JavaScript on the page | Check a value in memory |
| `browser_drag` | Drag and drop elements | Test drag-and-drop UI |
| `browser_wait_for` | Wait for text to appear/disappear | Wait for loading spinner to go away |

---

## Approach 2 — Playwright CLI + AI for Analysis

### What Is This?

You run tests yourself using the terminal. Then you share the output (pass/fail,
errors, HTML report) with an AI model and ask it to help you understand, debug,
or improve the results.

### When to Use This

| Scenario | Why CLI + AI is Best |
|----------|---------------------|
| **Running the full test suite** | CLI runs all 6 tests in parallel — faster than MCP |
| **Debugging a failure** | Paste the error into Claude/ChatGPT and get an explanation |
| **Reviewing the HTML report** | Ask AI to suggest what to test next based on results |
| **CI/CD pipelines** | CLI is the only option in automated pipelines |
| **Performance testing** | CLI gives you timing data that AI can analyze |

### How It Works

**Step 1: Run tests**
```bash
# Run all tests
npm test

# Run only login tests
npm run test:login

# Run with visible browser (see what's happening)
npm run run:headed

# Run in debug mode (step through line by line)
npm run test:debug

# Run with Playwright's interactive UI
npm run test:ui
```

**Step 2: Look at results**
```bash
# Open the HTML report in your browser
open reports/execution-report-2026-03-03.html

# Or open Playwright's built-in report
npx playwright show-report
```

**Step 3: Share with AI for analysis**

Copy the terminal output (or the error message) and paste it into your AI chat.

### Real Example — Debugging a Failed Test

```
YOU → Claude Opus 4.6:

"I ran our Playwright tests and TC02 failed. Here's the error:

  Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
  Locator: getByText('Your password is invalid!')

  Call log:
    waiting for getByText('Your password is invalid!')

The test is in tests/login.test.ts, TC02.
We're testing https://the-internet.herokuapp.com/login.
What's wrong?"
```

```
CLAUDE OPUS 4.6 → YOU:

"The error means Playwright waited 10 seconds for the text
'Your password is invalid!' to appear on the page, but it
never showed up.

Possible causes:
1. The error message text may have changed. Visit the page
   manually, enter a wrong password, and check the EXACT
   error text (it might say 'Your password is invalid'
   without the exclamation mark).

2. The error flash message might disappear quickly. Try adding
   a shorter timeout or checking immediately after clicking:
   await expect(page.getByText('Your password is invalid!'))
     .toBeVisible({ timeout: 15000 });

3. The page might be loading slowly. Add:
   await page.waitForLoadState('networkidle');
   before the assertion.

Let me check the actual page for you..."

[AI uses MCP to verify the actual error message text]
```

### Useful CLI Commands for AI-Assisted Debugging

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `npm test` | Run all 6 tests | Daily regression |
| `npm run test:login` | Run only UI tests | After UI changes |
| `npm run test:api` | Run only API tests | After backend changes |
| `npm run run:headed` | Run with visible browser | When you want to watch |
| `npm run test:debug` | Step-by-step debugging | When a test fails |
| `npm run test:ui` | Interactive Playwright UI | Visual test exploration |
| `npx playwright test --grep "TC01"` | Run one specific test | Isolating a failure |
| `npx playwright test --repeat-each 5` | Run each test 5 times | Finding flaky tests |
| `npx playwright test --trace on` | Record full trace | Deep debugging |
| `npx playwright show-report` | Open last HTML report | Reviewing results |

### Feed Trace Files to AI

Playwright can record **trace files** — a complete replay of everything that happened
during the test (DOM snapshots, network requests, console logs, screenshots at every step).

```bash
# Generate a trace
npx playwright test --trace on

# The trace file will be at:
# test-results/[test-name]/trace.zip

# View it in Playwright Trace Viewer:
npx playwright show-trace test-results/[test-name]/trace.zip
```

You can describe what you see in the Trace Viewer to the AI for deeper analysis.

---

## Approach 3 — AI Code Generation

### What Is This?

You describe what you want to test **in plain English**, and the AI writes the
Playwright test code for you. You review it, paste it into a file, and run it.

### When to Use This

| Scenario | Why AI Generation is Best |
|----------|--------------------------|
| **Writing new test cases** | Describe the test, AI writes the code |
| **Adding assertions** | "Also check the URL changes to /dashboard" |
| **Creating page objects** | "Create a CheckoutPage class for our checkout flow" |
| **Converting manual test cases** | "Here are 5 manual test steps from JIRA, convert to Playwright" |
| **Learning** | See how an expert would write the test |

### How It Works — Real Conversation

```
YOU → Claude Opus 4.6 (in VS Code with Copilot):

"I need a new Playwright test for our project. The test should:
- Go to https://the-internet.herokuapp.com/add_remove_elements/
- Click the 'Add Element' button 3 times
- Verify that 3 'Delete' buttons appear
- Click one Delete button
- Verify only 2 Delete buttons remain
- Use our xray-test-fixture and enhancedLogger pattern
- XRAY ID is PROJ-201"
```

```
CLAUDE OPUS 4.6 → generates:

// File: tests/add-remove.test.ts

import { test, expect } from './xray-test-fixture';
import { enhancedLogger } from '../utils/helpers/enhanced-logger';

test.describe('Add/Remove Elements Tests', () => {

  test('TC07: Should add and remove elements correctly', {
    annotation: { type: 'xray', description: 'PROJ-201' },
  }, async ({ page, xrayTestKey }) => {

    enhancedLogger.step('Step 1: Navigate to Add/Remove Elements page', xrayTestKey);
    await page.goto('https://the-internet.herokuapp.com/add_remove_elements/');

    enhancedLogger.step('Step 2: Click Add Element button 3 times', xrayTestKey);
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Add Element' }).click();
    }

    enhancedLogger.step('Step 3: Verify 3 Delete buttons appeared', xrayTestKey);
    const deleteButtons = page.getByRole('button', { name: 'Delete' });
    await expect(deleteButtons).toHaveCount(3);

    enhancedLogger.step('Step 4: Click one Delete button', xrayTestKey);
    await deleteButtons.first().click();

    enhancedLogger.step('Step 5: Verify only 2 Delete buttons remain', xrayTestKey);
    await expect(deleteButtons).toHaveCount(2);

    enhancedLogger.pass('TC07 passed — Add/Remove elements working correctly', xrayTestKey);
  });

});
```

> **Notice:** The AI automatically used the project's patterns — `xray-test-fixture`,
> `enhancedLogger`, annotation format, naming convention — because it can read
> the existing test files in the workspace.

---

## Setup Guide

### Option A: VS Code + GitHub Copilot (Claude Opus 4.6)

This is the **recommended setup** for this project. You get both Playwright MCP
and AI chat in one place.

**Step 1: Install GitHub Copilot in VS Code**
```
VS Code → Extensions (Ctrl+Shift+X) → Search "GitHub Copilot" → Install
```

**Step 2: Switch to Claude Opus 4.6 model**
```
In Copilot chat → click the model name → select "Claude Opus 4.6"
```

**Step 3: Add Playwright MCP Server**

Run this one-time command in your terminal:
```bash
code --add-mcp '{"name":"playwright","command":"npx","args":["@playwright/mcp@latest"]}'
```

Or create/edit `.vscode/mcp.json` in the project root:
```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**Step 4: Verify it works**

Open Copilot chat (Agent mode) and type:
```
Navigate to https://the-internet.herokuapp.com/login and tell me
what form fields are on the page.
```

If Playwright MCP is working, the AI will open a browser, read the page,
and tell you there's a Username field, Password field, and Login button.

---

### Option B: Claude Desktop (Standalone)

**Step 1: Install Claude Desktop**
Download from https://claude.ai/download

**Step 2: Configure Playwright MCP**

Open Claude Desktop settings → "Developer" → "Edit Config" → add:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**Step 3: Restart Claude Desktop**

Now Claude can browse the web for you when you ask it to.

---

### Option C: Cursor IDE

**Step 1: Open Cursor Settings** → MCP Servers → Add:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**Step 2:** Use the AI chat (Cmd+K) with any supported model.

---

### Option D: OpenAI Codex CLI

**Step 1: Install Codex CLI**
```bash
npm install -g @openai/codex
```

**Step 2: Add Playwright MCP**
```bash
codex mcp add playwright npx "@playwright/mcp@latest"
```

Or edit `~/.codex/config.toml`:
```toml
[mcp_servers.playwright]
command = "npx"
args = ["@playwright/mcp@latest"]
```

**Step 3: Use Codex with this project**
```bash
cd /path/to/playwrightJIRA_XRAY_Opus4.6
codex "Run the login tests and explain any failures"
```

---

### Advanced MCP Configuration

For production-grade setups, create a config file:

```json
// playwright-mcp-config.json
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": {
      "headless": false,
      "channel": "chrome"
    },
    "contextOptions": {
      "viewport": { "width": 1280, "height": 720 }
    }
  },
  "capabilities": ["core", "pdf", "vision"],
  "saveTrace": true,
  "saveVideo": { "width": 1280, "height": 720 },
  "outputDir": "./mcp-output",
  "network": {
    "allowedOrigins": [
      "https://the-internet.herokuapp.com",
      "https://jsonplaceholder.typicode.com"
    ]
  }
}
```

Then use it:
```bash
npx @playwright/mcp@latest --config playwright-mcp-config.json
```

---

## Real Prompts You Can Copy-Paste

Here are tested prompts that work with Claude Opus 4.6 or OpenAI o3/Codex.
Copy them directly into your AI chat.

---

### 🔍 Exploratory Testing Prompts

**Prompt 1 — Full feature exploration:**
```
Using Playwright MCP, go to https://the-internet.herokuapp.com/login.
Take a snapshot of the page. Tell me:
1. What form fields exist?
2. What buttons are available?
3. Are there any accessibility issues?
4. Try logging in with username 'tomsmith' and password 'SuperSecretPassword!'
5. What happens after login?
6. Is there a logout button?
7. Try logging out and confirm you're back on the login page.
```

**Prompt 2 — Negative testing:**
```
Using Playwright MCP, go to https://the-internet.herokuapp.com/login and test
these edge cases:
1. Empty username + empty password → what error appears?
2. Valid username 'tomsmith' + empty password → what error appears?
3. Empty username + any password → what error appears?
4. Username with spaces: '  tomsmith  ' → does it work?
5. SQL injection in username: ' OR 1=1 -- → what happens?
6. Very long password (200 characters) → what happens?
Report each result as a table: Input | Expected | Actual | Pass/Fail
```

**Prompt 3 — API exploration:**
```
Test these API endpoints and report the results:

1. GET https://jsonplaceholder.typicode.com/posts/1
   - What status code? What fields in the response?

2. POST https://jsonplaceholder.typicode.com/posts
   with body: {"title": "Test", "body": "Hello", "userId": 1}
   - What status code? Did it return an ID?

3. GET https://jsonplaceholder.typicode.com/posts/99999
   - What happens with an invalid ID?

4. DELETE https://jsonplaceholder.typicode.com/posts/1
   - What status code?

Format as a table: Endpoint | Method | Status | Key Findings
```

---

### 🐛 Debugging Prompts

**Prompt 4 — Explain a failure:**
```
My Playwright test TC01 in tests/login.test.ts failed with this error:

[paste your error here]

The test is testing login at https://the-internet.herokuapp.com/login.
Look at the test file and explain:
1. What went wrong?
2. What is the most likely cause?
3. How do I fix it?
4. Show me the corrected code.
```

**Prompt 5 — Analyze HTML report:**
```
I just ran 'npm test' on our Playwright project. The results:
- TC01: PASS (12.3s)
- TC02: PASS (12.3s)
- TC03: PASS (12.2s)
- TC04: PASS (619ms)
- TC05: PASS (450ms)
- TC06: PASS (247ms)

Questions:
1. Why are UI tests (TC01-TC03) so much slower than API tests (TC04-TC06)?
2. Is 12 seconds for a login test acceptable?
3. What could make the UI tests faster?
4. Should I be concerned about anything?
```

**Prompt 6 — Find flaky tests:**
```
Run this command and analyze the results:

npx playwright test --repeat-each 10

If any test fails intermittently, explain why it might be flaky and
suggest a fix.
```

---

### ✍️ Test Generation Prompts

**Prompt 7 — Generate test from manual steps:**
```
Convert these manual test steps into a Playwright test using our
project's patterns (xray-test-fixture, enhancedLogger, annotation format):

Manual Test Case: Verify Forgot Password Link
XRAY ID: PROJ-301
Steps:
  1. Go to https://the-internet.herokuapp.com/login
  2. Click "Forgot Password?" link (if it exists)
  3. Verify the URL changes
  4. Check what's on the new page

Use the existing test files in tests/login.test.ts as a reference
for the code style and patterns.
```

**Prompt 8 — Generate page object:**
```
Look at pages/LoginPage.ts in our project. Create a similar page object
for the Secure Area page (https://the-internet.herokuapp.com/secure).
It should have methods for:
- Verifying the welcome message
- Clicking the Logout button
- Verifying the URL
Follow the same pattern as LoginPage.ts.
```

**Prompt 9 — Generate API test:**
```
Look at tests/api.test.ts for our project's API test pattern.
Write a new test that:
- Tests PUT https://jsonplaceholder.typicode.com/posts/1
- Sends an updated title and body
- Verifies 200 response
- Verifies the response echoes the updated data
- Uses XRAY ID PROJ-207
- Follow the exact same import/logger/annotation pattern
```

---

### 📊 Analysis Prompts

**Prompt 10 — Code review:**
```
Review the entire test suite in tests/ and pages/ folders of this project.
Assess:
1. Code quality and patterns
2. Test coverage gaps — what's NOT being tested?
3. Any anti-patterns or fragile selectors?
4. Suggestions for new tests to add
5. Are the page objects being used effectively?
```

**Prompt 11 — Accessibility audit:**
```
Using Playwright MCP, navigate to https://the-internet.herokuapp.com/login
and run a full accessibility audit. Check:
1. All form fields have proper labels
2. Color contrast is sufficient
3. Keyboard navigation works (Tab through all fields)
4. Screen reader would understand the page
5. Error messages are announced to assistive technology
Report as: Issue | Severity | WCAG Rule | How to Fix
```

---

## Model Comparison

### Which AI Model Should I Use?

| Task | Best Model | Why |
|------|-----------|-----|
| **Exploratory testing with MCP** | Claude Opus 4.6 | Best MCP tool-use; methodical browser interaction |
| **Debugging test failures** | Claude Opus 4.6 or OpenAI o3 | Both excellent at reading error traces |
| **Generating new test code** | Claude Opus 4.6 | Follows existing code patterns precisely |
| **Bulk test generation** | OpenAI Codex | Designed specifically for code tasks |
| **Reasoning about test strategy** | OpenAI o3 | Strong multi-step reasoning |
| **Quick questions** | Any model | All handle simple Q&A well |
| **CI/CD integration** | OpenAI Codex CLI | Runs headlessly in terminal |
| **VS Code inline help** | GitHub Copilot (any model) | Integrated into your editor |

### Feature Comparison

| Feature | Claude Opus 4.6 | OpenAI o3 | OpenAI Codex | GitHub Copilot |
|---------|-----------------|-----------|--------------|----------------|
| **MCP support** | ✅ Full (via VS Code, Claude Desktop, Cursor) | ✅ Via API | ✅ Via CLI | ✅ Via VS Code |
| **Browser automation** | ✅ Via Playwright MCP | ❌ No MCP | ✅ Via Codex CLI MCP | ✅ Via Copilot MCP |
| **Code generation** | ✅ Excellent | ✅ Good | ✅ Excellent | ✅ Excellent |
| **Project context** | ✅ Reads full workspace | ⚠️ Paste manually | ✅ Reads workspace | ✅ Reads workspace |
| **Debugging** | ✅ Deep analysis | ✅ Step-by-step reasoning | ✅ Good | ✅ Good |
| **Cost** | Copilot subscription or API | API usage | API usage | Copilot subscription |
| **Best for** | Interactive QA work | Complex reasoning | Automated code tasks | Daily coding |

### How Each Model Connects to Playwright MCP

```
┌─────────────────────────┐     ┌─────────────────────────────┐
│  Claude Opus 4.6        │     │                             │
│  (via VS Code Copilot   │────▶│   Playwright MCP Server     │
│   or Claude Desktop)    │     │   (@playwright/mcp@latest)  │
└─────────────────────────┘     │                             │
                                │   ┌───────────────────────┐ │
┌─────────────────────────┐     │   │  Chromium Browser     │ │
│  OpenAI Codex           │────▶│   │  (real browser that   │ │
│  (via Codex CLI)        │     │   │   AI controls)        │ │
└─────────────────────────┘     │   └───────────────────────┘ │
                                │                             │
┌─────────────────────────┐     │   Tools available:          │
│  GitHub Copilot         │────▶│   • browser_navigate        │
│  (via VS Code)          │     │   • browser_click           │
└─────────────────────────┘     │   • browser_type            │
                                │   • browser_snapshot        │
┌─────────────────────────┐     │   • browser_fill_form       │
│  Cursor / Windsurf      │────▶│   • browser_take_screenshot │
│  (any MCP-compatible    │     │   • browser_console_messages│
│   IDE or tool)          │     │   • browser_network_requests│
└─────────────────────────┘     │   • ... and more            │
                                └─────────────────────────────┘
```

---

## Workflow Examples

### Workflow 1: Daily Regression + AI Review

```
Morning:
  1. Open terminal
  2. Run: npm test
  3. Open the HTML report:
     open reports/execution-report-$(date +%Y-%m-%d).html
  4. If all green → you're done ✅
  5. If a test failed:
     - Copy the error from terminal
     - Open Copilot chat (Claude Opus 4.6)
     - Paste: "This test failed: [error]. Why? How do I fix it?"
     - AI explains the issue and suggests a fix

Time: 5–10 minutes
```

### Workflow 2: New Feature — AI Writes the Test

```
  1. Product team tells you: "Test the /dropdown page"

  2. Open Copilot chat (Claude Opus 4.6 + Playwright MCP):
     "Using Playwright MCP, go to
      https://the-internet.herokuapp.com/dropdown
      and explore the page. Tell me what's there and what we should test."

  3. AI navigates, takes a snapshot, and reports:
     "There's a dropdown with options 'Option 1' and 'Option 2'.
      Default selection is blank. I'd suggest testing:
      - Selecting Option 1 and verifying it's selected
      - Selecting Option 2 and verifying it changes
      - Checking that no option is selected by default"

  4. You say: "Write those as Playwright tests using our project's pattern.
     Use XRAY IDs PROJ-301, PROJ-302, PROJ-303."

  5. AI generates tests/dropdown.test.ts with all 3 tests.

  6. You copy the file, run: npm test
     → All pass ✅

  7. Commit and push.

Time: 15–20 minutes (vs. 1–2 hours writing from scratch)
```

### Workflow 3: Converting Manual Test Cases from JIRA

```
  1. You have 10 manual test cases in JIRA/XRAY:
     PROJ-401 through PROJ-410

  2. Export them (or copy the steps) and paste into AI chat:

     "Here are 10 manual test cases from JIRA. Convert each one
      into a Playwright automated test using our project's pattern.
      Group them logically into test files.

      PROJ-401: Login with valid credentials
        Step 1: Go to login page
        Step 2: Enter tomsmith / SuperSecretPassword!
        Step 3: Click Login
        Expected: Redirected to /secure

      PROJ-402: Login with invalid credentials
        Step 1: Go to login page
        Step 2: Enter tomsmith / wrong
        Step 3: Click Login
        Expected: Error message appears

      [... more test cases ...]"

  3. AI generates complete test files with all XRAY annotations.

  4. You review, adjust, and run.

Time: 30 minutes for 10 tests (vs. 1–2 days manually)
```

### Workflow 4: Accessibility Testing with MCP

```
  1. Open Copilot chat with Playwright MCP:

     "Go to our login page at https://the-internet.herokuapp.com/login.
      Check all of these:
      1. Can you navigate the entire form using only the Tab key?
      2. Does every input field have a visible label?
      3. Are there any color contrast issues?
      4. What would a screen reader announce for each element?
      5. Run the axe-core accessibility scan and show me violations."

  2. AI uses MCP to navigate, check each item, and reports findings.

  3. You log any issues as bugs in JIRA.

Time: 10 minutes (vs. 30–60 minutes manually)
```

---

## Limitations and Gotchas

### What AI + MCP CANNOT Do

| Limitation | Why | Workaround |
|-----------|-----|-----------|
| **Run your `npm test` suite** | MCP controls ONE browser — it doesn't run your test runner | Use CLI for running tests, MCP for exploring |
| **Access your JIRA directly** | MCP only controls a browser — it doesn't have your JIRA credentials | Share JIRA screenshots/text with AI manually |
| **See the visual design** | MCP reads accessibility tree, not pixels | Use `browser_take_screenshot` + vision models for visual checks |
| **Test mobile devices** | MCP uses desktop Chromium by default | Configure viewport in MCP config |
| **Replace your judgment** | AI can miss business logic issues | Always review AI-generated tests |
| **Run in CI/CD** | MCP needs an interactive session | Use Playwright CLI in CI; MCP for local exploration only |

### Common Mistakes to Avoid

| Mistake | What Happens | How to Avoid |
|---------|-------------|-------------|
| **Trusting AI-generated selectors blindly** | Selectors may break when the app changes | Review selectors, prefer `getByRole`/`getByLabel` over CSS selectors |
| **Generating too many tests at once** | Hard to review, some may be wrong | Generate 3–5 tests, review, then ask for more |
| **Not running tests after AI generates them** | Syntax errors or incorrect assertions slip through | Always run `npm test` after any code change |
| **Using MCP for performance benchmarks** | MCP adds overhead (AI processing time) | Use CLI for performance measurements |
| **Sharing secrets with AI** | Passwords or API keys could be exposed | Use `.env` files; never paste real credentials in prompts |

### MCP vs. CLI — Which to Use When

| Situation | Use MCP | Use CLI |
|-----------|---------|---------|
| "What does this page look like?" | ✅ | |
| "Run all 6 tests and check results" | | ✅ |
| "Fill this form with test data" | ✅ | |
| "Debug why TC02 is failing" | ✅ Explore | ✅ Run the test |
| "Generate a new test file" | | ✅ (AI chat without MCP) |
| "Test 50 different form inputs" | | ✅ (data-driven test) |
| "Quick sanity check after a deploy" | ✅ | |
| "CI/CD pipeline" | | ✅ |

---

## Glossary

| Term | What It Means |
|------|--------------|
| **MCP** | Model Context Protocol — a standard that lets AI tools connect to external services (like a browser) |
| **Playwright MCP** | Microsoft's official MCP server that gives AI models the ability to control a browser |
| **Accessibility Snapshot** | A structured text description of everything on a web page (buttons, fields, text, links) — like what a screen reader would see |
| **CLI** | Command Line Interface — running commands in your terminal (like `npm test`) |
| **Claude Opus 4.6** | Anthropic's most capable AI model (as of early 2026). Available through VS Code Copilot, Claude Desktop, Cursor, and the API |
| **OpenAI o3** | OpenAI's reasoning model — excellent at step-by-step problem solving |
| **OpenAI Codex** | OpenAI's code-specialized model — runs as a CLI tool or via API |
| **GitHub Copilot** | AI coding assistant integrated into VS Code. Can use Claude, OpenAI, or other models |
| **Agent Mode** | A Copilot mode where the AI can take actions (run commands, edit files, use MCP tools) rather than just answering questions |
| **Trace** | A recording of everything that happened during a Playwright test — DOM, network, console, screenshots at each step |
| **Fixture** | In Playwright, a reusable setup that provides something to your test (like `page` or `xrayTestKey`) |
| **Page Object** | A class that represents a web page (e.g., `LoginPage`) with methods for each action (e.g., `.login()`, `.verifySuccess()`) |

---

## 📎 Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  AI-ASSISTED TESTING QUICK REFERENCE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SETUP (one time):                                          │
│    code --add-mcp '{"name":"playwright","command":"npx",    │
│      "args":["@playwright/mcp@latest"]}'                    │
│                                                             │
│  DAILY TESTING:                                             │
│    npm test                  ← run all tests                │
│    npm run run:headed        ← run with visible browser     │
│    npm run test:debug        ← step-by-step debugging       │
│                                                             │
│  ASK AI TO EXPLORE (in Copilot/Claude chat):                │
│    "Go to [URL] and tell me what's on the page"             │
│    "Fill the login form and check what happens"             │
│    "Find accessibility issues on this page"                 │
│                                                             │
│  ASK AI TO WRITE (in Copilot/Claude chat):                  │
│    "Write a test for [feature] using our project pattern"   │
│    "Convert these manual steps into a Playwright test"      │
│    "Create a page object for [page name]"                   │
│                                                             │
│  ASK AI TO DEBUG (paste error + ask):                       │
│    "This test failed with [error]. Why? How to fix?"        │
│    "Why is TC02 taking 15 seconds?"                         │
│    "Is this test flaky? How can I stabilize it?"            │
│                                                             │
│  MODELS:                                                    │
│    Claude Opus 4.6  → Best for MCP + code generation        │
│    OpenAI o3        → Best for complex reasoning            │
│    OpenAI Codex     → Best for CLI automation               │
│    GitHub Copilot   → Best for VS Code inline help          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

*Last updated: 3 March 2026*
