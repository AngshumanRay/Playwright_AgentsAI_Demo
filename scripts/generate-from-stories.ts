#!/usr/bin/env ts-node
// =============================================================================
// scripts/generate-from-stories.ts — AGENT-DRIVEN TEST GENERATION PIPELINE
// =============================================================================
// COMMAND 1: npm run generate -- US-101-login
//
// FLOW:
//   1. Read User Story YAML (user-stories/<filename>.yaml)
//   2. Parse BDD acceptance criteria (Given/When/Then)
//   3. Generate Manual Test Cases (manual-test-cases/<storyId>-test-cases.md)
//   4. Generate Playwright Test Script (tests/<storyId>.test.ts)
//   5. Generate Page Object (pages/<StoryModule>Page.ts)  [Web only]
//   6. Remind user to populate test data in web-tests.yaml or api-tests.yaml
//
// NOTE: Test data must be manually entered in test-data/web-tests.yaml or
//       test-data/api-tests.yaml BEFORE running tests. The data file has
//       two control fields per entry:
//         run:  true/false  → enables/disables test execution
//         tags: [Smoke, Sanity, Regression]  → for tag-based filtering
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BDDScenario {
  given: string[];
  when: string[];
  then: string[];
}

interface AcceptanceCriterion {
  id: string;       // AC-1, AC-2, ...
  title: string;
  tags: string[];    // ["Smoke", "Regression"]
  scenario: BDDScenario;
}

interface UserStory {
  storyId: string;   // US-101
  title: string;
  type: 'Web' | 'API';
  description: string;
  priority: string;
  module: string;
  baseUrl: string;
  pagePath: string;
  acceptanceCriteria: AcceptanceCriterion[];
}

// ─── Paths ───────────────────────────────────────────────────────────────────

const ROOT          = path.resolve(__dirname, '..');
const STORIES_DIR   = path.join(ROOT, 'user-stories');
const TESTS_DIR     = path.join(ROOT, 'tests');
const PAGES_DIR     = path.join(ROOT, 'pages');
const MANUAL_TC_DIR = path.join(ROOT, 'manual-test-cases');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function banner(msg: string): void {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${msg}`);
  console.log('═'.repeat(70));
}

function ok(msg: string): void { console.log(`  ✅ ${msg}`); }
function skip(msg: string): void { console.log(`  ⏭️  ${msg}`); }

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function toPascalCase(str: string): string {
  return str.replace(/[^a-zA-Z0-9 ]/g, '').split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

// ─── Generator: Manual Test Cases (Markdown) ─────────────────────────────────

function generateManualTestCases(story: UserStory): string {
  const lines: string[] = [];
  const now = new Date().toISOString().split('T')[0];

  lines.push(`# 📋 Manual Test Cases — ${story.storyId}: ${story.title}`);
  lines.push(`> Generated: ${now} | Priority: ${story.priority} | Module: ${story.module}`);
  lines.push('');
  lines.push(`## 📖 User Story`);
  lines.push(`> ${story.description.trim()}`);
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Story ID | ${story.storyId} |`);
  lines.push(`| Type | ${story.type} |`);
  lines.push(`| Base URL | \`${story.baseUrl}\` |`);
  lines.push(`| Page Path | \`${story.pagePath}\` |`);
  lines.push('');
  lines.push('---');

  for (const ac of story.acceptanceCriteria) {
    lines.push('');
    lines.push(`## 🧪 ${story.storyId}.${ac.id}: ${ac.title}`);
    lines.push(`**Tags:** ${ac.tags.map(t => `\`${t}\``).join(', ')}`);
    lines.push('');

    // BDD Scenario
    lines.push('### Scenario (BDD)');
    lines.push('');
    for (const g of ac.scenario.given) lines.push(`- **Given** ${g}`);
    for (const w of ac.scenario.when)  lines.push(`- **When** ${w}`);
    for (const t of ac.scenario.then)  lines.push(`- **Then** ${t}`);
    lines.push('');

    // Test Steps table
    lines.push('### Test Steps');
    lines.push('| Step | Action | Expected Result | Pass/Fail |');
    lines.push('|:----:|--------|-----------------|:---------:|');
    let step = 1;
    for (const w of ac.scenario.when) {
      const expected = ac.scenario.then[step - 1] || '—';
      lines.push(`| ${step++} | ${w} | ${expected} | ⬜ |`);
    }
    // Any remaining "then" items
    for (let i = ac.scenario.when.length; i < ac.scenario.then.length; i++) {
      lines.push(`| ${step++} | Verify | ${ac.scenario.then[i]} | ⬜ |`);
    }
    lines.push('');

    // Test Data reference
    lines.push(`### Test Data`);
    lines.push(`> Data key: \`${story.storyId}.${ac.id}\` in \`test-data/${story.type === 'API' ? 'api' : 'web'}-tests.yaml\``);
    lines.push('');
    lines.push('---');
  }

  return lines.join('\n');
}

// ─── Generator: Web Test Script ──────────────────────────────────────────────

function generateWebTestScript(story: UserStory): string {
  const pageClass = toPascalCase(story.module) + 'Page';
  const lines: string[] = [];

  lines.push(`// =============================================================================`);
  lines.push(`// tests/${story.storyId.toLowerCase()}.test.ts — ${story.title}`);
  lines.push(`// =============================================================================`);
  lines.push(`// Auto-generated from: user-stories/${story.storyId.toLowerCase()}-*.yaml`);
  lines.push(`// Data source: test-data/web-tests.yaml`);
  lines.push(`// =============================================================================`);
  lines.push('');
  lines.push(`import { test, expect } from '../utils/framework/xray-test-fixture';`);
  lines.push(`import { ${pageClass} } from '../pages/${pageClass}';`);
  lines.push(`import { enhancedLogger } from '../utils/helpers/enhanced-logger';`);
  lines.push(`import { loadTestEntry } from '../utils/helpers/test-data-loader';`);
  lines.push('');
  lines.push(`const DATA_FILE = 'web-tests.yaml';`);
  lines.push('');
  lines.push(`test.describe('${story.storyId}: ${story.title}', () => {`);

  for (const ac of story.acceptanceCriteria) {
    const key = `${story.storyId}.${ac.id}`;
    lines.push('');
    lines.push(`  // ── ${key}: ${ac.title} ──`);
    lines.push(`  // Tags: ${ac.tags.join(', ')}`);
    lines.push(`  // Given: ${ac.scenario.given.join(' AND ')}`);
    lines.push(`  // When:  ${ac.scenario.when.join(' → ')}`);
    lines.push(`  // Then:  ${ac.scenario.then.join(' AND ')}`);
    lines.push(`  test('${key}: ${ac.title.replace(/'/g, "\\'")}',`);
    lines.push(`    { annotation: { type: 'xray', description: '${key}' } },`);
    lines.push(`    async ({ page, xrayTestKey }) => {`);
    lines.push(`      // Load test data & check run flag`);
    lines.push(`      const td = loadTestEntry(DATA_FILE, '${key}');`);
    lines.push(`      if (!td.run) test.skip();`);
    lines.push('');
    lines.push(`      enhancedLogger.section(\`▶ Running: ${key} | \${td.title}\`);`);
    lines.push(`      const pageObj = new ${pageClass}(page);`);
    lines.push('');

    // Generate step code from BDD scenario
    let stepNum = 1;
    for (const g of ac.scenario.given) {
      lines.push(`      // Given: ${g}`);
    }
    for (const w of ac.scenario.when) {
      lines.push(`      // Step ${stepNum}: ${w}`);
      lines.push(`      enhancedLogger.step('Step ${stepNum}: ${w.replace(/'/g, "\\'")}', xrayTestKey);`);
      lines.push(`      // TODO: Implement step — ${w}`);
      stepNum++;
    }
    lines.push('');
    for (const t of ac.scenario.then) {
      lines.push(`      // Then: ${t}`);
      lines.push(`      // TODO: Add assertion — ${t}`);
    }
    lines.push('');
    lines.push(`      enhancedLogger.pass('${key} passed', xrayTestKey);`);
    lines.push(`    }`);
    lines.push(`  );`);
  }

  lines.push(`});`);
  lines.push('');
  return lines.join('\n');
}

// ─── Generator: API Test Script ──────────────────────────────────────────────

function generateApiTestScript(story: UserStory): string {
  const lines: string[] = [];

  lines.push(`// =============================================================================`);
  lines.push(`// tests/${story.storyId.toLowerCase()}.test.ts — ${story.title}`);
  lines.push(`// =============================================================================`);
  lines.push(`// Auto-generated from: user-stories/${story.storyId.toLowerCase()}-*.yaml`);
  lines.push(`// Data source: test-data/api-tests.yaml`);
  lines.push(`// =============================================================================`);
  lines.push('');
  lines.push(`import { test, expect } from '../utils/framework/xray-test-fixture';`);
  lines.push(`import { enhancedLogger } from '../utils/helpers/enhanced-logger';`);
  lines.push(`import { loadTestEntry } from '../utils/helpers/test-data-loader';`);
  lines.push('');
  lines.push(`const DATA_FILE = 'api-tests.yaml';`);
  lines.push('');
  lines.push(`test.describe('${story.storyId}: ${story.title}', () => {`);

  for (const ac of story.acceptanceCriteria) {
    const key = `${story.storyId}.${ac.id}`;
    lines.push('');
    lines.push(`  // ── ${key}: ${ac.title} ──`);
    lines.push(`  // Tags: ${ac.tags.join(', ')}`);
    lines.push(`  test('${key}: ${ac.title.replace(/'/g, "\\'")}',`);
    lines.push(`    { annotation: { type: 'xray', description: '${key}' } },`);
    lines.push(`    async ({ request, xrayTestKey }) => {`);
    lines.push(`      const td = loadTestEntry(DATA_FILE, '${key}');`);
    lines.push(`      if (!td.run) test.skip();`);
    lines.push('');
    lines.push(`      enhancedLogger.section(\`▶ Running: ${key} | \${td.title}\`);`);
    lines.push('');

    // Generate API step code
    let stepNum = 1;
    for (const w of ac.scenario.when) {
      lines.push(`      // Step ${stepNum}: ${w}`);
      lines.push(`      enhancedLogger.step('Step ${stepNum}: ${w.replace(/'/g, "\\'")}', xrayTestKey);`);
      lines.push(`      // TODO: Implement API call — ${w}`);
      stepNum++;
    }
    lines.push('');
    for (const t of ac.scenario.then) {
      lines.push(`      // Then: ${t}`);
      lines.push(`      // TODO: Add assertion — ${t}`);
    }
    lines.push('');
    lines.push(`      enhancedLogger.pass('${key} passed', xrayTestKey);`);
    lines.push(`    }`);
    lines.push(`  );`);
  }

  lines.push(`});`);
  lines.push('');
  return lines.join('\n');
}

// ─── Generator: Page Object (Web only) ──────────────────────────────────────

function generatePageObject(story: UserStory): string {
  const className = toPascalCase(story.module) + 'Page';
  const lines: string[] = [];

  lines.push(`// =============================================================================`);
  lines.push(`// pages/${className}.ts — Page Object for ${story.title}`);
  lines.push(`// =============================================================================`);
  lines.push(`// Auto-generated from: user-stories/${story.storyId.toLowerCase()}-*.yaml`);
  lines.push(`// TODO: Update selectors to match your application`);
  lines.push(`// =============================================================================`);
  lines.push('');
  lines.push(`import { type Page, expect } from '@playwright/test';`);
  lines.push(`import { BasePage } from './BasePage';`);
  lines.push('');
  lines.push(`export class ${className} extends BasePage {`);
  lines.push('');
  lines.push(`  constructor(page: Page) {`);
  lines.push(`    super(page);`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  // TODO: Add locators and methods specific to ${story.module}`);
  lines.push(`}`);
  lines.push('');
  return lines.join('\n');
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

function main(): void {
  const storyFilter = process.argv[2]; // e.g., "US-101-login"

  banner('🚀 Playwright AgentsAI Demo — Generate from User Story');

  if (!storyFilter) {
    console.log('');
    console.log('  Usage: npm run generate -- <story-filename>');
    console.log('  Example: npm run generate -- US-101-login');
    console.log('');
    console.log('  Available stories in user-stories/:');
    const files = fs.readdirSync(STORIES_DIR).filter(f => f.endsWith('.yaml'));
    files.forEach(f => console.log(`    • ${f.replace('.yaml', '')}`));
    console.log('');
    process.exit(1);
  }

  // Find the story file
  const storyFile = fs.readdirSync(STORIES_DIR)
    .find(f => f.includes(storyFilter) && f.endsWith('.yaml'));

  if (!storyFile) {
    console.error(`  ❌ No story file found matching: ${storyFilter}`);
    process.exit(1);
  }

  // Parse the story
  const raw = fs.readFileSync(path.join(STORIES_DIR, storyFile), 'utf-8');
  const story = parseYaml(raw) as UserStory;

  banner(`📖 ${story.storyId}: ${story.title} (${story.type})`);
  console.log(`  Priority: ${story.priority} | Module: ${story.module}`);
  console.log(`  Acceptance Criteria: ${story.acceptanceCriteria.length}`);

  const dataFile = story.type === 'API' ? 'api-tests.yaml' : 'web-tests.yaml';

  // ── Step 1: Generate Manual Test Cases ──
  banner('📝 Step 1: Generating Manual Test Cases');
  ensureDir(MANUAL_TC_DIR);
  const tcFilename = `${story.storyId}-test-cases.md`;
  const tcPath = path.join(MANUAL_TC_DIR, tcFilename);
  if (fs.existsSync(tcPath)) {
    skip(`${tcFilename} already exists (delete to regenerate)`);
  } else {
    fs.writeFileSync(tcPath, generateManualTestCases(story), 'utf-8');
    ok(`Created: manual-test-cases/${tcFilename}`);
  }

  // ── Step 2: Generate Test Script ──
  banner('🧪 Step 2: Generating Test Script');
  ensureDir(TESTS_DIR);
  const testFilename = `${story.storyId.toLowerCase()}.test.ts`;
  const testPath = path.join(TESTS_DIR, testFilename);
  if (fs.existsSync(testPath)) {
    skip(`${testFilename} already exists (delete to regenerate)`);
  } else {
    const script = story.type === 'API'
      ? generateApiTestScript(story)
      : generateWebTestScript(story);
    fs.writeFileSync(testPath, script, 'utf-8');
    ok(`Created: tests/${testFilename}`);
  }

  // ── Step 3: Generate Page Object (Web only) ──
  if (story.type === 'Web') {
    banner('📄 Step 3: Generating Page Object');
    ensureDir(PAGES_DIR);
    const poFilename = `${toPascalCase(story.module)}Page.ts`;
    const poPath = path.join(PAGES_DIR, poFilename);
    if (fs.existsSync(poPath)) {
      skip(`${poFilename} already exists (delete to regenerate)`);
    } else {
      fs.writeFileSync(poPath, generatePageObject(story), 'utf-8');
      ok(`Created: pages/${poFilename}`);
    }
  }

  // ── Summary ──
  banner('✅ Generation Complete');
  console.log(`  📋 Manual test cases → manual-test-cases/${tcFilename}`);
  console.log(`  🧪 Test script       → tests/${testFilename}`);
  if (story.type === 'Web') {
    console.log(`  📄 Page object       → pages/${toPascalCase(story.module)}Page.ts`);
  }
  console.log('');
  console.log('  ⚡ NEXT STEPS:');
  console.log(`  1. Add/verify test data in test-data/${dataFile}`);
  console.log(`     Keys: ${story.acceptanceCriteria.map(ac => `${story.storyId}.${ac.id}`).join(', ')}`);
  console.log(`  2. Set run: true/false and tags for each entry`);
  console.log(`  3. Implement TODO items in the generated test script`);
  console.log(`  4. Run tests:   npx playwright test tests/${testFilename}`);
  console.log(`  5. Run report:  npm run report`);
  console.log('');
}

main();
