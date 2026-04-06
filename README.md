# 🚀 Playwright AgentsAI Demo

> **AI-powered BDD test automation framework** with JIRA XRAY integration, data-driven YAML, and beautiful HTML reports.

---

## 📁 Project Structure

```
├── user-stories/          # BDD User Stories from JIRA (YAML)
│   ├── US-101-login.yaml
│   └── US-102-api-posts.yaml
├── test-data/             # Test data (2 files only: Web + API)
│   ├── web-tests.yaml     # All Web/UI test data
│   └── api-tests.yaml     # All API test data
├── tests/                 # Generated Playwright test scripts
├── pages/                 # Page Objects (BasePage + generated)
├── manual-test-cases/     # Generated manual test case docs
├── scripts/               # Pipeline scripts
│   ├── generate-from-stories.ts   # Command 1: Story → Tests
│   └── generate-report.ts         # Command 2: Beautiful Report
├── utils/                 # Framework utilities
│   ├── framework/         # Test fixtures, global setup/teardown
│   ├── helpers/           # Logger, data loader, screenshots, screencast
│   ├── reporting/         # HTML report generator
│   ├── security/          # AES-256 encryption
│   ├── api/               # API helpers
│   └── jira-xray/         # JIRA XRAY integration
├── test-results/
│   └── screencasts/       # 🎬 Screencast .webm recordings (Playwright 1.59)
├── reports/               # Generated HTML reports
├── logs/                  # Test run logs
└── playwright.config.ts   # Playwright configuration
```

---

## ⚡ Two Commands — That's All You Need

### Command 1: Generate Everything from a User Story

```bash
npm run generate -- US-101-login
```

This reads the BDD user story and generates:
- ✅ Manual test cases (Markdown) → `manual-test-cases/`
- ✅ Playwright test script → `tests/`
- ✅ Page Object (Web only) → `pages/`

### Command 2: Generate Beautiful Report

```bash
npm run report
```

Produces a stunning single-file HTML report with:
- 📊 Charts & Graphs (pie, bar, stacked)
- 📖 User Story → BDD Test Case mapping
- ⏱️ Performance metrics
- ♿ Accessibility insights
- 🔒 Security posture
- 📈 Observability dashboard

---

## 🔄 Complete Workflow

```
1. Customer provides User Story → you create YAML in user-stories/
2. You fill test data in test-data/web-tests.yaml or api-tests.yaml
   (set run: true/false and tags: [Smoke, Regression])
3. npm run generate -- <story-filename>    ← Generates everything
4. Implement test logic (fill in TODOs)    ← Or use AI agent
5. npm run test:report                     ← Run tests + generate report
   (or separately: npx playwright test → npm run report)
```

---

## 📝 Data File Format

### User Story (`user-stories/US-101-login.yaml`)
```yaml
storyId: "US-101"
title: "Login Functionality"
type: "Web"              # Web | API
acceptanceCriteria:
  - id: "AC-1"
    title: "Successful login"
    tags: ["Smoke", "Regression"]
    scenario:
      given: ["The user is on the login page"]
      when:  ["The user enters credentials", "Clicks Login"]
      then:  ["User is redirected to secure area"]
```

### Test Data (`test-data/web-tests.yaml`)
```yaml
US-101.AC-1:
  run: true                         # true = execute, false = skip
  tags: ["Smoke", "Regression"]     # For tag-based filtering
  title: "Successful login"
  username: "tomsmith"
  password: "SuperSecretPassword!"
  expectedUrl: "/secure"
```

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run generate -- <story>` | Generate tests from user story |
| `npm run test:report` | Run all tests + generate HTML report |
| `npm run report` | Generate beautiful HTML report (standalone) |
| `npm test` | Run all Playwright tests |
| `npm run test:headed` | Run tests in visible browser |
| `npm run test:debug` | Run tests in debug mode |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run lint` | TypeScript type check |
| `npm run clean` | Clean generated artifacts |

---

## 🛡️ Features

- **BDD-Driven**: Given/When/Then acceptance criteria from JIRA
- **Data-Driven**: External YAML data files with run/tags control
- **JIRA XRAY**: Automatic result upload to XRAY (when configured)
- **Accessibility**: Axe-core scans after every test
- **Security**: AES-256 password encryption (`${ENC:...}`)
- **Environment**: `.env` variable substitution (`${ENV:...}`)
- **Page Object Model**: BasePage + generated page objects
- **Logging**: Winston with daily rotating files
- **Screenshots**: Auto-capture on failure
- **🎬 Screencast** (Playwright 1.59): Automatic video recording with action annotations, chapter cards, agentic AI overlays, and result banners — creating "agentic video receipts" for every test

---

## 🎬 Screencast — Agentic Video Receipts (Playwright 1.59)

Every UI test is automatically recorded as a `.webm` video with rich visual annotations:

| Feature | Description |
|---------|-------------|
| 🎥 Video Recording | Browser screen recorded via `page.screencast.start/stop` |
| 🏷️ Action Annotations | Every click, fill, navigate labeled on-screen |
| 📖 Chapter Cards | Title cards with blur backdrop at test start and key steps |
| 🤖 Agentic AI Overlay | Branded badge: test name, environment, timestamp |
| ✅/❌ Result Cards | Green PASS / Red FAIL banner at test completion |
| 📸 Real-Time Frames | `onFrame` callback delivers JPEG frames (extensible for AI vision) |

### .env Configuration

```dotenv
SCREENCAST_ENABLED=true           # Master toggle (default: true)
SCREENCAST_SHOW_ACTIONS=true      # Action labels on video
SCREENCAST_SHOW_CHAPTERS=true     # Chapter title cards
SCREENCAST_QUALITY=80             # JPEG quality 0–100
SCREENCAST_SIZE=1280x720          # Video resolution
```

Recordings are saved to `test-results/screencasts/` — zero test code changes needed.

---

**Author:** AngshumanRay  
**License:** ISC
