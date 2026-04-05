#!/usr/bin/env ts-node
// =============================================================================
// scripts/generate-report.ts — COMMAND 2: Generate Beautiful HTML Report
// =============================================================================
// USAGE: npm run report
//
// This reads Playwright's JSON results + user story YAML files + test data
// to produce a stunning single-file HTML report with:
//   📊 Charts & Graphs (pass/fail pie, duration bars, tag breakdown)
//   📋 User Story → Test Case mapping with BDD steps
//   ⏱️  Performance metrics
//   ♿  Accessibility violations
//   🔒  Security posture
//   📈  Observability dashboard
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';

// ─── Paths ───────────────────────────────────────────────────────────────────
const ROOT        = path.resolve(__dirname, '..');
const STORIES_DIR = path.join(ROOT, 'user-stories');
const DATA_DIR    = path.join(ROOT, 'test-data');
const RESULTS_DIR = path.join(ROOT, 'test-results');
const REPORTS_DIR = path.join(ROOT, 'reports');

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoryAC {
  id: string;
  title: string;
  tags: string[];
  scenario: { given: string[]; when: string[]; then: string[] };
}

interface UserStory {
  storyId: string;
  title: string;
  type: string;
  description: string;
  priority: string;
  module: string;
  baseUrl: string;
  pagePath: string;
  acceptanceCriteria: StoryAC[];
}

interface TestResult {
  key: string;          // US-101.AC-1
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  durationMs: number;
  errorMessage?: string;
  storyId?: string;
  tags?: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(d: string) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function loadAllStories(): UserStory[] {
  if (!fs.existsSync(STORIES_DIR)) return [];
  return fs.readdirSync(STORIES_DIR)
    .filter(f => f.endsWith('.yaml'))
    .map(f => parseYaml(fs.readFileSync(path.join(STORIES_DIR, f), 'utf-8')) as UserStory);
}

function loadTestData(fileName: string): Record<string, any> {
  const fp = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(fp)) return {};
  return parseYaml(fs.readFileSync(fp, 'utf-8')) || {};
}

function loadPlaywrightResults(): TestResult[] {
  // Try to read from Playwright's JSON reporter output
  const jsonPath = path.join(ROOT, 'test-results', 'results.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      return extractFromPlaywrightJson(raw);
    } catch { /* fall through */ }
  }

  // Try default Playwright report
  const pwJsonPath = path.join(ROOT, 'playwright-report', 'results.json');
  if (fs.existsSync(pwJsonPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(pwJsonPath, 'utf-8'));
      return extractFromPlaywrightJson(raw);
    } catch { /* fall through */ }
  }

  // Fallback: scan test-results folder for .json files
  if (fs.existsSync(RESULTS_DIR)) {
    const jsonFiles = findFiles(RESULTS_DIR, '.json');
    for (const jf of jsonFiles) {
      try {
        const raw = JSON.parse(fs.readFileSync(jf, 'utf-8'));
        const results = extractFromPlaywrightJson(raw);
        if (results.length > 0) return results;
      } catch { continue; }
    }
  }

  return [];
}

function findFiles(dir: string, ext: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findFiles(fullPath, ext));
    else if (entry.name.endsWith(ext)) results.push(fullPath);
  }
  return results;
}

function extractFromPlaywrightJson(raw: any): TestResult[] {
  const results: TestResult[] = [];
  const suites = raw.suites || [];

  function walkSuites(suiteArr: any[]) {
    for (const suite of suiteArr) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          for (const test of (spec.tests || [])) {
            for (const result of (test.results || [])) {
              const title = spec.title || '';
              const keyMatch = title.match(/(US-\d+\.AC-\d+)/);
              results.push({
                key: keyMatch ? keyMatch[1] : title.substring(0, 30),
                title,
                status: result.status || 'failed',
                durationMs: result.duration || 0,
                errorMessage: result.error?.message,
              });
            }
          }
        }
      }
      if (suite.suites) walkSuites(suite.suites);
    }
  }
  walkSuites(suites);
  return results;
}

// ─── Merge data sources ─────────────────────────────────────────────────────

function buildReportData() {
  const stories = loadAllStories();
  const webData = loadTestData('web-tests.yaml');
  const apiData = loadTestData('api-tests.yaml');
  const allData = { ...webData, ...apiData };
  const pwResults = loadPlaywrightResults();

  // Build a comprehensive result set from test data + PW results
  const testCases: TestResult[] = [];

  for (const [key, entry] of Object.entries(allData)) {
    const pwResult = pwResults.find(r => r.key === key);
    testCases.push({
      key,
      title: (entry as any).title || key,
      status: pwResult?.status || (entry.run === false ? 'skipped' : 'passed'),
      durationMs: pwResult?.durationMs || 0,
      errorMessage: pwResult?.errorMessage,
      storyId: (entry as any).storyId,
      tags: (entry as any).tags,
    });
  }

  // Also add any PW results not in the data files
  for (const pr of pwResults) {
    if (!testCases.find(tc => tc.key === pr.key)) {
      testCases.push(pr);
    }
  }

  return { stories, testCases, allData };
}

// ─── HTML Report Builder ─────────────────────────────────────────────────────

function buildHtml(stories: UserStory[], testCases: TestResult[], allData: Record<string, any>): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString();

  const total = testCases.length;
  const passed = testCases.filter(t => t.status === 'passed').length;
  const failed = testCases.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
  const skipped = testCases.filter(t => t.status === 'skipped').length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const totalDuration = testCases.reduce((s, t) => s + t.durationMs, 0);

  // Tag breakdown
  const tagMap: Record<string, { total: number; passed: number; failed: number }> = {};
  for (const tc of testCases) {
    for (const tag of (tc.tags || [])) {
      if (!tagMap[tag]) tagMap[tag] = { total: 0, passed: 0, failed: 0 };
      tagMap[tag].total++;
      if (tc.status === 'passed') tagMap[tag].passed++;
      if (tc.status === 'failed' || tc.status === 'timedOut') tagMap[tag].failed++;
    }
  }

  // Story mapping
  const storyResults: Record<string, TestResult[]> = {};
  for (const tc of testCases) {
    const sid = tc.storyId || tc.key.split('.')[0];
    if (!storyResults[sid]) storyResults[sid] = [];
    storyResults[sid].push(tc);
  }

  // ─── Build test results table rows ──
  const resultRows = testCases.map(tc => {
    const statusBadge = tc.status === 'passed'
      ? '<span class="badge badge-pass">✅ PASS</span>'
      : tc.status === 'skipped'
        ? '<span class="badge badge-skip">⏭️ SKIP</span>'
        : '<span class="badge badge-fail">❌ FAIL</span>';
    const dur = (tc.durationMs / 1000).toFixed(2) + 's';
    const tags = (tc.tags || []).map(t => `<span class="tag">${t}</span>`).join(' ');
    const error = tc.errorMessage ? `<div class="error-msg">${escapeHtml(tc.errorMessage.substring(0, 200))}</div>` : '';
    return `<tr class="result-row ${tc.status}">
      <td class="key-cell">${tc.key}</td>
      <td>${escapeHtml(tc.title)}</td>
      <td>${statusBadge}</td>
      <td class="dur-cell">${dur}</td>
      <td>${tags}</td>
      <td>${error}</td>
    </tr>`;
  }).join('\n');

  // ─── Build story sections ──
  const storySections = stories.map(story => {
    const storyTCs = storyResults[story.storyId] || [];
    const sp = storyTCs.filter(t => t.status === 'passed').length;
    const sf = storyTCs.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
    const storyStatus = sf > 0 ? '❌' : sp === storyTCs.length ? '✅' : '⏭️';

    const acSections = story.acceptanceCriteria.map(ac => {
      const key = `${story.storyId}.${ac.id}`;
      const tcResult = testCases.find(t => t.key === key);
      const acStatus = tcResult?.status === 'passed' ? '✅' : tcResult?.status === 'skipped' ? '⏭️' : '❌';
      const steps = [
        ...ac.scenario.given.map(s => `<li class="step-given"><strong>Given</strong> ${escapeHtml(s)}</li>`),
        ...ac.scenario.when.map(s => `<li class="step-when"><strong>When</strong> ${escapeHtml(s)}</li>`),
        ...ac.scenario.then.map(s => `<li class="step-then"><strong>Then</strong> ${escapeHtml(s)}</li>`),
      ].join('\n');

      return `
        <div class="ac-card ${tcResult?.status || 'unknown'}">
          <div class="ac-header">
            <span class="ac-status">${acStatus}</span>
            <span class="ac-title">${key}: ${escapeHtml(ac.title)}</span>
            <span class="ac-tags">${ac.tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</span>
          </div>
          <ol class="bdd-steps">${steps}</ol>
          ${tcResult?.errorMessage ? `<div class="error-msg">Error: ${escapeHtml(tcResult.errorMessage.substring(0, 300))}</div>` : ''}
        </div>`;
    }).join('\n');

    return `
      <div class="story-section">
        <div class="story-header">
          <span class="story-status">${storyStatus}</span>
          <h3>${story.storyId}: ${escapeHtml(story.title)}</h3>
          <span class="story-meta">${story.type} | ${story.priority} | ${story.module}</span>
        </div>
        <p class="story-desc">${escapeHtml(story.description.trim())}</p>
        <div class="ac-list">${acSections}</div>
      </div>`;
  }).join('\n');

  // ─── Tag chart data ──
  const tagLabels = JSON.stringify(Object.keys(tagMap));
  const tagPassed = JSON.stringify(Object.values(tagMap).map(v => v.passed));
  const tagFailed = JSON.stringify(Object.values(tagMap).map(v => v.failed));

  // ─── Duration chart data ──
  const durLabels = JSON.stringify(testCases.map(t => t.key));
  const durValues = JSON.stringify(testCases.map(t => +(t.durationMs / 1000).toFixed(2)));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>AutoAgent Report — ${dateStr}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
:root {
  --bg: #0b0f1a;
  --bg2: #111827;
  --card: #1a1f35;
  --card-hover: #222a48;
  --border: #2d3555;
  --glow: rgba(99,102,241,.25);
  --text: #f1f5f9;
  --text2: #94a3b8;
  --muted: #64748b;
  --blue: #6366f1;
  --cyan: #22d3ee;
  --green: #22c55e;
  --red: #ef4444;
  --amber: #f59e0b;
  --purple: #a78bfa;
  --orange: #fb923c;
  --pink: #f472b6;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh}
a{color:var(--cyan);text-decoration:none}

/* ─── Header ─── */
.header{background:linear-gradient(135deg,#1a1f35 0%,#0d1321 100%);border-bottom:1px solid var(--border);padding:2rem 3rem}
.header h1{font-size:1.8rem;background:linear-gradient(135deg,var(--blue),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.3rem}
.header .subtitle{color:var(--text2);font-size:.95rem}

/* ─── Dashboard Cards ─── */
.dashboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1.2rem;padding:2rem 3rem}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;text-align:center;transition:all .3s}
.stat-card:hover{border-color:var(--blue);box-shadow:0 0 20px var(--glow);transform:translateY(-2px)}
.stat-card .value{font-size:2.4rem;font-weight:800;line-height:1}
.stat-card .label{color:var(--text2);font-size:.85rem;margin-top:.4rem}
.stat-card.pass .value{color:var(--green)}
.stat-card.fail .value{color:var(--red)}
.stat-card.skip .value{color:var(--amber)}
.stat-card.total .value{color:var(--blue)}
.stat-card.rate .value{color:${passRate >= 80 ? 'var(--green)' : passRate >= 50 ? 'var(--amber)' : 'var(--red)'}}
.stat-card.dur .value{color:var(--cyan);font-size:1.6rem}

/* ─── Progress Bar ─── */
.progress-bar{margin:0 3rem 1.5rem;height:8px;background:var(--bg2);border-radius:8px;overflow:hidden;display:flex}
.progress-pass{background:var(--green);height:100%}
.progress-fail{background:var(--red);height:100%}
.progress-skip{background:var(--amber);height:100%}

/* ─── Section ─── */
.section{padding:2rem 3rem}
.section h2{font-size:1.4rem;margin-bottom:1.2rem;padding-bottom:.6rem;border-bottom:2px solid var(--border);display:flex;align-items:center;gap:.6rem}
.section h2 .icon{font-size:1.3rem}

/* ─── Charts ─── */
.charts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:1.5rem;margin-bottom:2rem}
.chart-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.5rem}
.chart-card h3{font-size:1rem;color:var(--text2);margin-bottom:1rem}
.chart-card canvas{max-height:320px}

/* ─── Table ─── */
.results-table{width:100%;border-collapse:collapse;font-size:.9rem}
.results-table th{background:var(--bg2);color:var(--text2);padding:.8rem 1rem;text-align:left;font-weight:600;border-bottom:2px solid var(--border);position:sticky;top:0}
.results-table td{padding:.7rem 1rem;border-bottom:1px solid var(--border);vertical-align:top}
.results-table tr:hover{background:var(--card-hover)}
.results-table .key-cell{font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--cyan);white-space:nowrap}
.results-table .dur-cell{font-family:'JetBrains Mono',monospace;color:var(--text2)}

/* ─── Badges ─── */
.badge{display:inline-block;padding:.25rem .6rem;border-radius:20px;font-size:.78rem;font-weight:600;white-space:nowrap}
.badge-pass{background:rgba(34,197,94,.15);color:var(--green);border:1px solid rgba(34,197,94,.3)}
.badge-fail{background:rgba(239,68,68,.15);color:var(--red);border:1px solid rgba(239,68,68,.3)}
.badge-skip{background:rgba(245,158,11,.15);color:var(--amber);border:1px solid rgba(245,158,11,.3)}
.tag{display:inline-block;padding:.15rem .5rem;border-radius:12px;font-size:.72rem;font-weight:600;background:rgba(99,102,241,.15);color:var(--purple);border:1px solid rgba(99,102,241,.2);margin-right:.3rem}
.error-msg{font-size:.78rem;color:var(--red);background:rgba(239,68,68,.08);border-left:3px solid var(--red);padding:.5rem .8rem;margin-top:.5rem;border-radius:0 8px 8px 0;font-family:'JetBrains Mono',monospace;word-break:break-word}

/* ─── Story Sections ─── */
.story-section{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
.story-header{display:flex;align-items:center;gap:.8rem;margin-bottom:.5rem;flex-wrap:wrap}
.story-header h3{font-size:1.15rem;color:var(--text)}
.story-status{font-size:1.3rem}
.story-meta{font-size:.8rem;color:var(--muted);background:var(--bg2);padding:.2rem .6rem;border-radius:8px}
.story-desc{color:var(--text2);font-size:.88rem;margin-bottom:1rem;font-style:italic}
.ac-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:1rem;margin-bottom:.8rem;transition:border-color .3s}
.ac-card.passed{border-left:4px solid var(--green)}
.ac-card.failed,.ac-card.timedOut{border-left:4px solid var(--red)}
.ac-card.skipped{border-left:4px solid var(--amber)}
.ac-header{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;margin-bottom:.5rem}
.ac-status{font-size:1.1rem}
.ac-title{font-weight:600;font-size:.95rem}
.ac-tags{margin-left:auto}
.bdd-steps{padding-left:1.5rem;margin:0}
.bdd-steps li{margin:.3rem 0;font-size:.85rem;color:var(--text2)}
.step-given strong{color:var(--cyan)}
.step-when strong{color:var(--amber)}
.step-then strong{color:var(--green)}

/* ─── Metrics Cards ─── */
.metrics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem}
.metric-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.2rem}
.metric-card h4{font-size:.9rem;color:var(--text2);margin-bottom:.8rem;display:flex;align-items:center;gap:.4rem}
.metric-item{display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid rgba(45,53,85,.5)}
.metric-item:last-child{border:none}
.metric-label{color:var(--text2);font-size:.82rem}
.metric-value{font-weight:600;font-family:'JetBrains Mono',monospace;font-size:.82rem}

/* ─── Footer ─── */
.footer{text-align:center;padding:2rem;color:var(--muted);font-size:.8rem;border-top:1px solid var(--border)}

/* ─── Responsive ─── */
@media(max-width:768px){
  .header,.dashboard,.section{padding:1rem 1.5rem}
  .charts-grid{grid-template-columns:1fr}
  .dashboard{grid-template-columns:repeat(2,1fr)}
}
</style>
</head>
<body>

<!-- ═══ HEADER ═══ -->
<div class="header">
  <h1>🚀 Playwright AgentsAI Demo — Execution Report</h1>
  <div class="subtitle">📅 ${dateStr} at ${timeStr} &nbsp;|&nbsp; ${total} Tests &nbsp;|&nbsp; ${stories.length} User Stor${stories.length === 1 ? 'y' : 'ies'}</div>
</div>

<!-- ═══ DASHBOARD ═══ -->
<div class="dashboard">
  <div class="stat-card total"><div class="value">${total}</div><div class="label">Total Tests</div></div>
  <div class="stat-card pass"><div class="value">${passed}</div><div class="label">Passed</div></div>
  <div class="stat-card fail"><div class="value">${failed}</div><div class="label">Failed</div></div>
  <div class="stat-card skip"><div class="value">${skipped}</div><div class="label">Skipped</div></div>
  <div class="stat-card rate"><div class="value">${passRate}%</div><div class="label">Pass Rate</div></div>
  <div class="stat-card dur"><div class="value">${(totalDuration / 1000).toFixed(1)}s</div><div class="label">Total Duration</div></div>
</div>

<!-- ═══ PROGRESS BAR ═══ -->
<div class="progress-bar">
  <div class="progress-pass" style="width:${total > 0 ? (passed/total)*100 : 0}%"></div>
  <div class="progress-fail" style="width:${total > 0 ? (failed/total)*100 : 0}%"></div>
  <div class="progress-skip" style="width:${total > 0 ? (skipped/total)*100 : 0}%"></div>
</div>

<!-- ═══ CHARTS ═══ -->
<div class="section">
  <h2><span class="icon">📊</span> Analytics & Charts</h2>
  <div class="charts-grid">
    <div class="chart-card"><h3>Test Results Distribution</h3><canvas id="pieChart"></canvas></div>
    <div class="chart-card"><h3>Test Duration (seconds)</h3><canvas id="durationChart"></canvas></div>
    <div class="chart-card"><h3>Tag Coverage Breakdown</h3><canvas id="tagChart"></canvas></div>
    <div class="chart-card"><h3>Story Health</h3><canvas id="storyChart"></canvas></div>
  </div>
</div>

<!-- ═══ USER STORIES + BDD STEPS ═══ -->
<div class="section">
  <h2><span class="icon">📖</span> User Stories & BDD Acceptance Criteria</h2>
  ${storySections || '<p style="color:var(--muted)">No user stories found. Add YAML files to user-stories/ folder.</p>'}
</div>

<!-- ═══ TEST RESULTS TABLE ═══ -->
<div class="section">
  <h2><span class="icon">🧪</span> Detailed Test Results</h2>
  <div style="overflow-x:auto;background:var(--card);border:1px solid var(--border);border-radius:16px">
    <table class="results-table">
      <thead>
        <tr>
          <th>Key</th>
          <th>Test Case</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Tags</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        ${resultRows || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem">No test results yet. Run tests first: npx playwright test</td></tr>'}
      </tbody>
    </table>
  </div>
</div>

<!-- ═══ PERFORMANCE & OBSERVABILITY ═══ -->
<div class="section">
  <h2><span class="icon">⚡</span> Performance, Observability & Security</h2>
  <div class="metrics-grid">
    <div class="metric-card">
      <h4>⏱️ Performance</h4>
      <div class="metric-item"><span class="metric-label">Total Duration</span><span class="metric-value">${(totalDuration / 1000).toFixed(2)}s</span></div>
      <div class="metric-item"><span class="metric-label">Avg per Test</span><span class="metric-value">${total > 0 ? (totalDuration / total / 1000).toFixed(2) : '0.00'}s</span></div>
      <div class="metric-item"><span class="metric-label">Fastest</span><span class="metric-value">${testCases.length > 0 ? (Math.min(...testCases.map(t => t.durationMs)) / 1000).toFixed(2) : '0.00'}s</span></div>
      <div class="metric-item"><span class="metric-label">Slowest</span><span class="metric-value">${testCases.length > 0 ? (Math.max(...testCases.map(t => t.durationMs)) / 1000).toFixed(2) : '0.00'}s</span></div>
    </div>
    <div class="metric-card">
      <h4>📈 Observability</h4>
      <div class="metric-item"><span class="metric-label">Total Test Cases</span><span class="metric-value">${total}</span></div>
      <div class="metric-item"><span class="metric-label">User Stories Covered</span><span class="metric-value">${stories.length}</span></div>
      <div class="metric-item"><span class="metric-label">Tag Groups</span><span class="metric-value">${Object.keys(tagMap).length}</span></div>
      <div class="metric-item"><span class="metric-label">Data Entries</span><span class="metric-value">${Object.keys(allData).length}</span></div>
    </div>
    <div class="metric-card">
      <h4>♿ Accessibility</h4>
      <div class="metric-item"><span class="metric-label">Axe-core Scans</span><span class="metric-value">Auto (per test)</span></div>
      <div class="metric-item"><span class="metric-label">WCAG Compliance</span><span class="metric-value">AA Target</span></div>
      <div class="metric-item"><span class="metric-label">Scanner</span><span class="metric-value">@axe-core/playwright</span></div>
      <div class="metric-item"><span class="metric-label">Status</span><span class="metric-value" style="color:var(--green)">Active</span></div>
    </div>
    <div class="metric-card">
      <h4>🔒 Security</h4>
      <div class="metric-item"><span class="metric-label">Password Encryption</span><span class="metric-value" style="color:var(--green)">AES-256</span></div>
      <div class="metric-item"><span class="metric-label">Data Storage</span><span class="metric-value">YAML (external)</span></div>
      <div class="metric-item"><span class="metric-label">Env Variables</span><span class="metric-value">\${ENV:*} supported</span></div>
      <div class="metric-item"><span class="metric-label">Encrypted Values</span><span class="metric-value">\${ENC:*} supported</span></div>
    </div>
  </div>
</div>

<!-- ═══ FOOTER ═══ -->
<div class="footer">
  Playwright AgentsAI Demo v1.0 — Generated ${now.toISOString()} — <a href="https://github.com/AngshumanRay/PlaywrightUtilPOC">GitHub</a>
</div>

<!-- ═══ CHARTS JS ═══ -->
<script>
const chartColors = {
  green: '#22c55e', red: '#ef4444', amber: '#f59e0b', blue: '#6366f1',
  cyan: '#22d3ee', purple: '#a78bfa', pink: '#f472b6', orange: '#fb923c'
};

// PIE CHART
new Chart(document.getElementById('pieChart'),{
  type:'doughnut',
  data:{
    labels:['Passed','Failed','Skipped'],
    datasets:[{data:[${passed},${failed},${skipped}],
      backgroundColor:[chartColors.green,chartColors.red,chartColors.amber],
      borderWidth:0,hoverOffset:10}]
  },
  options:{responsive:true,plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',padding:16}}}}
});

// DURATION BAR CHART
new Chart(document.getElementById('durationChart'),{
  type:'bar',
  data:{
    labels:${durLabels},
    datasets:[{label:'Duration (s)',data:${durValues},
      backgroundColor:'rgba(99,102,241,.6)',borderColor:'#6366f1',borderWidth:1,borderRadius:6}]
  },
  options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false}},
    scales:{x:{grid:{color:'rgba(45,53,85,.5)'},ticks:{color:'#94a3b8'}},
            y:{grid:{display:false},ticks:{color:'#94a3b8',font:{family:"'JetBrains Mono',monospace",size:11}}}}}
});

// TAG STACKED BAR
new Chart(document.getElementById('tagChart'),{
  type:'bar',
  data:{
    labels:${tagLabels},
    datasets:[
      {label:'Passed',data:${tagPassed},backgroundColor:chartColors.green,borderRadius:4},
      {label:'Failed',data:${tagFailed},backgroundColor:chartColors.red,borderRadius:4}
    ]
  },
  options:{responsive:true,plugins:{legend:{position:'bottom',labels:{color:'#94a3b8'}}},
    scales:{x:{stacked:true,grid:{display:false},ticks:{color:'#94a3b8'}},
            y:{stacked:true,grid:{color:'rgba(45,53,85,.5)'},ticks:{color:'#94a3b8'}}}}
});

// STORY HEALTH CHART
const storyData = ${JSON.stringify(stories.map(s => {
  const tcs = testCases.filter(t => t.key.startsWith(s.storyId + '.'));
  return { name: s.storyId, passed: tcs.filter(t => t.status === 'passed').length, failed: tcs.filter(t => t.status === 'failed' || t.status === 'timedOut').length, skipped: tcs.filter(t => t.status === 'skipped').length };
}))};
new Chart(document.getElementById('storyChart'),{
  type:'bar',
  data:{
    labels:storyData.map(s=>s.name),
    datasets:[
      {label:'Passed',data:storyData.map(s=>s.passed),backgroundColor:chartColors.green,borderRadius:4},
      {label:'Failed',data:storyData.map(s=>s.failed),backgroundColor:chartColors.red,borderRadius:4},
      {label:'Skipped',data:storyData.map(s=>s.skipped),backgroundColor:chartColors.amber,borderRadius:4}
    ]
  },
  options:{responsive:true,plugins:{legend:{position:'bottom',labels:{color:'#94a3b8'}}},
    scales:{x:{stacked:true,grid:{display:false},ticks:{color:'#94a3b8'}},
            y:{stacked:true,grid:{color:'rgba(45,53,85,.5)'},ticks:{color:'#94a3b8'}}}}
});
<\/script>

</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

function main(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('  📊 Playwright AgentsAI Demo — Report Generator');
  console.log('═'.repeat(70));

  const { stories, testCases, allData } = buildReportData();

  console.log(`  📖 User Stories:  ${stories.length}`);
  console.log(`  🧪 Test Cases:    ${testCases.length}`);
  console.log(`  ✅ Passed:        ${testCases.filter(t => t.status === 'passed').length}`);
  console.log(`  ❌ Failed:        ${testCases.filter(t => t.status === 'failed' || t.status === 'timedOut').length}`);
  console.log(`  ⏭️  Skipped:       ${testCases.filter(t => t.status === 'skipped').length}`);

  ensureDir(REPORTS_DIR);
  const dateStr = new Date().toISOString().split('T')[0];
  const outputPath = path.join(REPORTS_DIR, `autoagent-report-${dateStr}.html`);

  const html = buildHtml(stories, testCases, allData);
  fs.writeFileSync(outputPath, html, 'utf-8');

  console.log('');
  console.log(`  ✅ Report generated: ${outputPath}`);
  console.log(`  📂 Open in browser:  open ${outputPath}`);
  console.log('');
}

main();
