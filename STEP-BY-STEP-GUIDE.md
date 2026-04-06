# 📖 Step-by-Step Guide for Beginners

> **Zero Playwright knowledge required.** Follow these steps in order and you'll have a fully working AI-powered test automation framework running on your machine.

---

## 📑 Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [Prerequisites — Install These First](#2-prerequisites--install-these-first)
3. [Clone the Project](#3-clone-the-project)
4. [Install Dependencies](#4-install-dependencies)
5. [Understand the Folder Structure](#5-understand-the-folder-structure)
6. [Understand the Two-Command Architecture](#6-understand-the-two-command-architecture)
7. [Run the Existing Tests (Your First Run!)](#7-run-the-existing-tests-your-first-run)
8. [View the Reports](#8-view-the-reports)
9. [Understand User Stories (YAML Files)](#9-understand-user-stories-yaml-files)
10. [Understand Test Data (YAML Files)](#10-understand-test-data-yaml-files)
11. [Create Your Own User Story (Step-by-Step)](#11-create-your-own-user-story-step-by-step)
12. [Generate Tests from Your Story](#12-generate-tests-from-your-story)
13. [Add Test Data for Your Story](#13-add-test-data-for-your-story)
14. [Implement the Test Logic](#14-implement-the-test-logic)
15. [Run Your New Tests](#15-run-your-new-tests)
16. [Understanding the .env File](#16-understanding-the-env-file)
17. [Understanding Screencast Video Recordings](#17-understanding-screencast-video-recordings)
18. [Useful Commands Cheat Sheet](#18-useful-commands-cheat-sheet)
19. [Troubleshooting Common Issues](#19-troubleshooting-common-issues)
20. [Glossary — Key Terms Explained](#20-glossary--key-terms-explained)

---

## 1. What Is This Project?

This is an **AI-powered test automation framework** that:

```
Customer gives you a User Story
        ↓
You run ONE command → it generates:
  ✅ Manual test cases (documentation)
  ✅ Automated test script
  ✅ Page Object (for web tests)
        ↓
You run ANOTHER command → it:
  ✅ Runs all tests automatically
  ✅ Records video of every test (Screencast)
  ✅ Generates a beautiful HTML report
```

**You don't need to write complex Playwright code.** The framework does the heavy lifting.

---

## 2. Prerequisites — Install These First

Before you begin, install these tools on your computer:

### 2.1 Install Node.js

Node.js is the engine that runs this project.

1. Go to: **https://nodejs.org**
2. Download the **LTS** version (the green button)
3. Run the installer, click "Next" through all steps
4. Verify it worked — open your Terminal (Mac) or Command Prompt (Windows):

```bash
node --version
# Should show something like: v22.x.x

npm --version
# Should show something like: 10.x.x
```

### 2.2 Install Visual Studio Code (VS Code)

VS Code is the code editor we'll use.

1. Go to: **https://code.visualstudio.com**
2. Download and install it
3. Open it

### 2.3 Install Git

Git is for downloading the project code.

1. Go to: **https://git-scm.com/downloads**
2. Download and install it
3. Verify:

```bash
git --version
# Should show something like: git version 2.x.x
```

> 💡 **Mac users**: You might already have Git. Try `git --version` first.

---

## 3. Clone the Project

"Cloning" means downloading the project from GitHub to your computer.

### 3.1 Open Terminal

- **Mac**: Open the `Terminal` app (search for it in Spotlight with Cmd+Space)
- **Windows**: Open `Command Prompt` or `PowerShell`

### 3.2 Navigate to where you want the project

```bash
# Mac — go to your Desktop
cd ~/Desktop

# Windows — go to your Desktop
cd %USERPROFILE%\Desktop
```

### 3.3 Clone (download) the project

```bash
git clone https://github.com/AngshumanRay/Playwright_AgentsAI_Demo.git
```

### 3.4 Enter the project folder

```bash
cd Playwright_AgentsAI_Demo
```

### 3.5 Open it in VS Code

```bash
code .
```

> This opens the entire project in VS Code. If `code .` doesn't work, open VS Code manually and use **File → Open Folder** to select `Playwright_AgentsAI_Demo`.

---

## 4. Install Dependencies

"Dependencies" are the libraries (tools) this project needs to work.

### 4.1 Install Node.js packages

In your terminal (make sure you're inside the project folder):

```bash
npm install
```

> ⏳ This takes 1–2 minutes. It downloads all required packages into a `node_modules/` folder.

### 4.2 Install Playwright browsers

Playwright needs browser engines (Chromium, Firefox, etc.) to run tests:

```bash
npx playwright install
```

> ⏳ This takes 2–5 minutes. It downloads browser binaries.

### 4.3 Verify everything installed correctly

```bash
npx tsc --noEmit
```

> If you see **no output and no errors**, everything is good! ✅  
> If you see errors, go back and make sure Step 4.1 completed successfully.

---

## 5. Understand the Folder Structure

Here's what each folder does (you only need to touch the ⭐ folders):

```
Playwright_AgentsAI_Demo/
│
├── ⭐ user-stories/           ← You CREATE user stories here (YAML files)
│   ├── US-101-login.yaml      ← Example: Web login user story
│   └── US-102-api-posts.yaml  ← Example: API user story
│
├── ⭐ test-data/              ← You ADD test data here
│   ├── web-tests.yaml         ← All Web/UI test data lives in ONE file
│   └── api-tests.yaml         ← All API test data lives in ONE file
│
├── tests/                     ← Generated test scripts (auto-created)
│   ├── us-101.test.ts
│   └── us-102.test.ts
│
├── pages/                     ← Page Objects (auto-created for Web tests)
│   ├── BasePage.ts            ← Base class — don't modify
│   └── AuthenticationPage.ts  ← Generated for US-101
│
├── manual-test-cases/         ← Generated documentation (auto-created)
│
├── reports/                   ← Beautiful HTML reports (auto-created)
│
├── test-results/              ← Test artifacts
│   └── screencasts/           ← 🎬 Video recordings of every test
│
├── scripts/                   ← The two main pipeline scripts
│   ├── generate-from-stories.ts  ← Reads story → generates tests
│   └── generate-report.ts        ← Reads results → generates report
│
├── utils/                     ← Framework utilities (don't modify)
├── config/                    ← Environment configuration
├── logs/                      ← Daily rotating log files
├── .env                       ← ⭐ Your settings (URLs, toggles, etc.)
├── SKILLS.md                  ← AI Agent instruction file
└── playwright.config.ts       ← Test runner configuration
```

**Key takeaway**: You mainly work with 3 things:
1. `user-stories/` — Create story YAML files
2. `test-data/` — Add test data
3. `.env` — Configure settings

---

## 6. Understand the Two-Command Architecture

The entire framework runs on just **two commands**:

| Command | What It Does |
|---------|-------------|
| `npm run generate -- <story-name>` | Reads a user story → generates test cases, test script, and page object |
| `npm run test:report` | Runs all tests → records video → generates HTML report |

That's it. Two commands for the full QE automation lifecycle.

---

## 7. Run the Existing Tests (Your First Run!)

The project comes with 6 pre-built tests. Let's run them!

### 7.1 Run all tests + generate report

```bash
npm run test:report
```

### 7.2 What happens behind the scenes

```
1. Playwright launches a Chromium browser (invisible — headless mode)
2. It runs 6 tests:
   • US-101.AC-1: Logs in with valid credentials      ← Web test
   • US-101.AC-2: Logs in with wrong password          ← Web test
   • US-101.AC-3: Logs in with empty fields            ← Web test
   • US-102.AC-1: GET /posts/1 (API call)              ← API test
   • US-102.AC-2: POST /posts (create blog post)       ← API test
   • US-102.AC-3: GET /users/1 (user profile)          ← API test
3. Each test is video-recorded (screencast)
4. A beautiful HTML report is generated
```

### 7.3 Expected output

You should see:

```
Running 6 tests using 2 workers
  ✓ US-101.AC-1: Successful login with valid credentials
  ✓ US-101.AC-2: Login fails with invalid password
  ✓ US-101.AC-3: Login fails with empty credentials
  ✓ US-102.AC-1: GET single post returns valid response
  ✓ US-102.AC-2: POST creates a new blog post
  ✓ US-102.AC-3: GET user profile returns nested fields

  6 passed
```

> 🎉 **Congratulations!** You just ran your first automated tests!

---

## 8. View the Reports

After running tests, three types of reports are available:

### 8.1 AutoAgent Report (the beautiful one)

```bash
# Mac
open reports/autoagent-report-2026-04-06.html

# Windows
start reports\autoagent-report-2026-04-06.html
```

> Replace the date with today's date. This report has charts, BDD mapping, performance metrics, and accessibility insights.

### 8.2 Playwright HTML Report

```bash
npx playwright show-report
```

> This opens Playwright's built-in report in your browser with screenshots and trace details.

### 8.3 Screencast Videos

Look in `test-results/screencasts/` — you'll find `.webm` video files for each test. Double-click any file to play it in your browser or media player.

Each video shows:
- 🤖 An "AI Agent" badge in the top-left corner
- 🏷️ Action labels showing every click, type, and navigation
- 📖 Chapter title cards at test start and end
- ✅/❌ A PASS or FAIL banner at the end

---

## 9. Understand User Stories (YAML Files)

A **User Story** describes WHAT a user wants to do. It lives in `user-stories/` as a YAML file.

### 9.1 Anatomy of a User Story file

Open `user-stories/US-101-login.yaml` in VS Code. Here's what each field means:

```yaml
storyId: "US-101"                    # Unique ID (format: US-XXX)
title: "Login Functionality"         # Short title
type: "Web"                          # "Web" = browser test, "API" = API test
description: >                       # What the user wants (As a... I want... So that...)
  As a registered user, I want to log in...
priority: "High"                     # High, Medium, Low
module: "Authentication"             # Which area of the app
baseUrl: "https://the-internet.herokuapp.com"  # Website URL
pagePath: "/login"                   # Which page to test

acceptanceCriteria:                  # The "rules" the feature must satisfy
  - id: "AC-1"                       # Acceptance Criterion 1
    title: "Successful login"
    tags: ["Smoke", "Regression"]    # Test categories
    scenario:
      given:                         # Setup conditions
        - "The user is on the login page"
      when:                          # User actions
        - "The user enters a valid username"
        - "The user enters a valid password"
        - "The user clicks the Login button"
      then:                          # Expected results
        - "The user is redirected to the secure area"
        - "A success flash message is displayed"
```

### 9.2 Web Story vs API Story

| Field | Web Story | API Story |
|-------|-----------|-----------|
| `type` | `"Web"` | `"API"` |
| `pagePath` | Page URL path (e.g., `/login`) | API endpoint (e.g., `/posts`) |
| `baseUrl` | Website URL | API server URL |
| Actions | Click, fill, navigate | GET, POST, PUT, DELETE |

---

## 10. Understand Test Data (YAML Files)

Test data is the **specific values** used during tests (usernames, passwords, expected messages, etc.).

### 10.1 Where does test data go?

| Test Type | Data File |
|-----------|-----------|
| Web/UI tests | `test-data/web-tests.yaml` |
| API tests | `test-data/api-tests.yaml` |

### 10.2 Anatomy of a test data entry

```yaml
US-101.AC-1:                           # Key = StoryID.AC-ID (matches the story)
  run: true                            # true = run this test, false = skip it
  tags: ["Smoke", "Regression"]        # Test categories
  storyId: "US-101"                    # Which story this belongs to
  feature: "Login Functionality"       # Feature name
  title: "Successful login"            # Human-readable title
  baseUrl: "https://the-internet.herokuapp.com"
  pagePath: "/login"
  username: "tomsmith"                 # Test data — the actual values
  password: "SuperSecretPassword!"
  expectedUrl: "/secure"               # What we expect after the test
  expectedMessage: "You logged into a secure area!"
```

### 10.3 The `run` flag — skip or execute

```yaml
US-101.AC-1:
  run: true     # ← This test WILL run

US-101.AC-2:
  run: false    # ← This test will be SKIPPED
```

> 💡 This is powerful! You can disable any test without deleting it.

---

## 11. Create Your Own User Story (Step-by-Step)

Let's say your customer gives you this requirement:

> *"Users should be able to add items to a shopping cart and see the total price."*

### Step 1: Create the YAML file

Create a new file: `user-stories/US-103-shopping-cart.yaml`

```yaml
storyId: "US-103"
title: "Shopping Cart"
type: "Web"
description: >
  As a shopper, I want to add items to my cart,
  so that I can see the total price before checkout.
priority: "High"
module: "Cart"
baseUrl: "https://www.saucedemo.com"
pagePath: "/inventory.html"

acceptanceCriteria:

  - id: "AC-1"
    title: "Add single item to cart"
    tags: ["Smoke", "Regression"]
    scenario:
      given:
        - "The user is logged in and on the products page"
      when:
        - "The user clicks Add to Cart on the first product"
      then:
        - "The cart badge shows 1 item"

  - id: "AC-2"
    title: "Cart shows correct total"
    tags: ["Regression"]
    scenario:
      given:
        - "The user has added an item to the cart"
      when:
        - "The user clicks the cart icon"
      then:
        - "The cart page displays the correct item and price"
```

### Step 2: Save the file

That's it for the user story! The framework will read this file in the next step.

---

## 12. Generate Tests from Your Story

Now run **Command 1** to generate everything:

```bash
npm run generate -- US-103-shopping-cart
```

### What gets created

```
✅ manual-test-cases/US-103-test-cases.md    ← Manual test documentation
✅ tests/us-103.test.ts                       ← Playwright test script
✅ pages/CartPage.ts                          ← Page Object (Web only)
```

### Check the generated files

Open `tests/us-103.test.ts` in VS Code. You'll see a test script with `// TODO` comments where you need to fill in the actual test logic.

---

## 13. Add Test Data for Your Story

Open `test-data/web-tests.yaml` and add entries at the bottom:

```yaml
# ─── US-103: Shopping Cart ───────────────────────────────────────────────────

US-103.AC-1:
  run: true
  tags: ["Smoke", "Regression"]
  storyId: "US-103"
  feature: "Shopping Cart"
  title: "Add single item to cart"
  baseUrl: "https://www.saucedemo.com"
  pagePath: "/inventory.html"
  loginUsername: "standard_user"
  loginPassword: "secret_sauce"
  expectedCartCount: "1"

US-103.AC-2:
  run: true
  tags: ["Regression"]
  storyId: "US-103"
  feature: "Shopping Cart"
  title: "Cart shows correct total"
  baseUrl: "https://www.saucedemo.com"
  pagePath: "/inventory.html"
  loginUsername: "standard_user"
  loginPassword: "secret_sauce"
  expectedItemName: "Sauce Labs Backpack"
  expectedPrice: "$29.99"
```

---

## 14. Implement the Test Logic

Open the generated `tests/us-103.test.ts` and replace the `// TODO` sections with actual test steps. Here's the pattern:

```typescript
// The generated file already has this structure:
import { test, expect } from '../utils/framework/xray-test-fixture';
import { enhancedLogger } from '../utils/helpers/enhanced-logger';
import { loadTestEntry } from '../utils/helpers/test-data-loader';

const DATA_FILE = 'web-tests.yaml';

test.describe('US-103: Shopping Cart', () => {

  test('US-103.AC-1: Add single item to cart',
    { annotation: { type: 'xray', description: 'US-103.AC-1' } },
    async ({ page, xrayTestKey }) => {
      const td = loadTestEntry(DATA_FILE, 'US-103.AC-1');
      if (!td.run) test.skip();

      enhancedLogger.section(`▶ Running: US-103.AC-1 | ${td.title}`);

      // TODO: Fill in your test steps here
      // Step 1: Navigate to the page
      await page.goto(`${td.baseUrl}${td.pagePath}`);

      // Step 2: Your actual test actions...
      // Step 3: Your assertions...
    }
  );
});
```

> 💡 **Tip for beginners**: Use the AI agent (GitHub Copilot, Copilot Chat) to fill in the TODOs! The agent reads `SKILLS.md` and knows exactly how to implement the test logic.

---

## 15. Run Your New Tests

### Run all tests (including your new ones)

```bash
npm run test:report
```

### Run only your new test file

```bash
npx playwright test tests/us-103.test.ts
```

### Run in visible browser (watch it happen!)

```bash
npm run test:headed
```

### Run in debug mode (step through each action)

```bash
npm run test:debug
```

---

## 16. Understanding the .env File

The `.env` file controls how the framework behaves. Here are the most important settings:

### Settings You Might Change

| Variable | Default | What It Does |
|----------|---------|-------------|
| `BASE_URL` | `https://the-internet.herokuapp.com` | The website being tested |
| `RUN_HEADLESS` | `true` | `true` = invisible browser, `false` = visible browser |
| `RUN_RETRIES` | `0` | How many times to retry a failed test |
| `SCREENCAST_ENABLED` | `true` | `true` = record videos, `false` = don't record |
| `LOG_LEVEL` | `info` | How detailed logs are: `debug`, `info`, `warn`, `error` |

### Settings You Can Ignore (for now)

| Variable | Why You Can Ignore It |
|----------|----------------------|
| `JIRA_*` | Only needed if you use JIRA. Framework skips gracefully if not configured. |
| `DB_*` | Only needed for database test data. Disabled by default. |
| `EMAIL_*` | Only needed for email verification tests. Disabled by default. |
| `ENCRYPTION_KEY` | Only needed if you store encrypted passwords. |

> 💡 The framework is designed to **skip gracefully** when optional features aren't configured. You won't get errors — just informational messages.

---

## 17. Understanding Screencast Video Recordings

Every time you run tests, the framework automatically records a **video of each test** using Playwright 1.59's Screencast API.

### Where are the videos?

```
test-results/screencasts/
├── US-101_AC-1_2026-04-06T15-42-49.webm
├── US-101_AC-2_2026-04-06T15-43-01.webm
├── US-102_AC-1_2026-04-06T15-42-49.webm
└── ...
```

### What's in the videos?

Each video includes:
- 🤖 **AI Agent badge** — Shows the test name, environment, and timestamp
- 🏷️ **Action labels** — Every click, type, and navigation is labeled on screen
- 📖 **Chapter cards** — Title card at the start of the test
- ✅/❌ **Result banner** — Green PASS or Red FAIL at the end

### How to play the videos

Double-click any `.webm` file — it opens in Chrome, Firefox, or VLC.

### How to turn off video recording

Edit `.env`:

```dotenv
SCREENCAST_ENABLED=false
```

### How to adjust video quality

```dotenv
SCREENCAST_QUALITY=80           # 0 = lowest, 100 = highest
SCREENCAST_SIZE=1280x720        # Video resolution
```

---

## 18. Useful Commands Cheat Sheet

### The Two Main Commands

```bash
# Command 1: Generate everything from a user story
npm run generate -- US-101-login

# Command 2: Run all tests + generate report
npm run test:report
```

### Running Tests

```bash
npm test                              # Run all tests (headless)
npm run test:headed                   # Run with visible browser (watch it!)
npm run test:debug                    # Run with debugger (step through)
npm run test:ui                       # Open Playwright UI mode (interactive)
npx playwright test tests/us-101.test.ts  # Run a single test file
```

### Viewing Results

```bash
npx playwright show-report            # Open Playwright HTML report
open reports/autoagent-report-*.html   # Open AutoAgent report (Mac)
```

### Maintenance

```bash
npm run lint                           # Check for TypeScript errors
npm run clean                          # Delete all generated files
npm run generate                       # List all available user stories
```

---

## 19. Troubleshooting Common Issues

### ❌ "npm: command not found"

**Problem**: Node.js is not installed or not in your PATH.  
**Fix**: Reinstall Node.js from https://nodejs.org and restart your terminal.

### ❌ "Cannot find module '@playwright/test'"

**Problem**: Dependencies not installed.  
**Fix**: Run `npm install` in the project folder.

### ❌ "Executable doesn't exist at..." (browser error)

**Problem**: Playwright browsers not installed.  
**Fix**: Run `npx playwright install`.

### ❌ Tests pass locally but fail in CI

**Problem**: GitHub Actions uses a different environment.  
**Fix**: Check `.github/workflows/playwright.yml` — it runs on Ubuntu. Make sure your tests don't depend on local file paths.

### ❌ "JIRA credentials are placeholder values"

**Problem**: This is a WARNING, not an error! The framework is telling you JIRA integration is not configured.  
**Fix**: This is expected for demo use. Tests still run fine. To connect JIRA, update the `JIRA_*` values in `.env`.

### ❌ Screencast videos are empty or 0 bytes

**Problem**: Test might have failed before recording started.  
**Fix**: Check if the test passed first (`npm test`). API-only tests produce smaller recordings since there's no visible browser content.

### ❌ "ENOSPC: no space left on device"

**Problem**: Too many screencast recordings filling disk.  
**Fix**: Run `npm run clean` to delete old test results, or set `SCREENCAST_ENABLED=false` in `.env`.

---

## 20. Glossary — Key Terms Explained

| Term | What It Means | Example |
|------|-------------|---------|
| **User Story** | A description of what a user wants to do | "As a user, I want to log in" |
| **Acceptance Criteria** | The rules a feature must satisfy | "Given I'm on the login page, When I enter valid credentials, Then I see the dashboard" |
| **BDD** | Behavior-Driven Development — writing requirements as Given/When/Then | The format used in user story YAML files |
| **YAML** | A simple data format (like JSON but easier to read) | The `.yaml` files in this project |
| **Playwright** | A browser automation tool by Microsoft | The engine that runs the tests |
| **Screencast** | Video recording of the browser during tests | `.webm` files in `test-results/screencasts/` |
| **Page Object** | A class that represents a web page | `AuthenticationPage.ts` |
| **Locator** | A way to find an element on a web page | `page.locator('#username')` |
| **Assertion** | A check that something is true | `expect(page).toHaveURL('/secure')` |
| **Headless** | Running the browser without a visible window | `RUN_HEADLESS=true` |
| **CI/CD** | Automatic testing when code is pushed to GitHub | GitHub Actions |
| **Test Fixture** | Reusable setup/teardown for tests | `xray-test-fixture.ts` |
| **XRAY** | A JIRA plugin for test management | Tracks test results in JIRA |
| **Screencast** | Playwright 1.59 video recording API | Records every test with action annotations |
| **Agentic AI** | AI that autonomously performs tasks | The AI agent that generates and runs tests |

---

## 🎓 Quick Start Summary

If you just want to get going fast, here's the absolute minimum:

```bash
# 1. Clone and setup (one-time)
git clone https://github.com/AngshumanRay/Playwright_AgentsAI_Demo.git
cd Playwright_AgentsAI_Demo
npm install
npx playwright install

# 2. Run the existing 6 tests and see the report
npm run test:report

# 3. Open the beautiful report
open reports/autoagent-report-*.html

# 4. Watch the test videos
open test-results/screencasts/

# 5. (Optional) See tests run in a visible browser
npm run test:headed
```

**That's 5 commands to go from zero to running automated tests with video recordings and beautiful reports.** 🚀

---

*Last updated: April 6, 2026 | Framework: Playwright AgentsAI Demo v1.1 | Playwright 1.59.1*
