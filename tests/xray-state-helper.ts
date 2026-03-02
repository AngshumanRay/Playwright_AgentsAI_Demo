// =============================================================================
// tests/xray-state-helper.ts — THIN WRAPPER FOR XRAY STATE
// =============================================================================
// PURPOSE:
//   This is a thin "bridge" file that re-exports the appendTestResult function
//   from utils/jira-xray/xray-state.ts.
//
//   WHY A SEPARATE FILE?
//   The xray-test-fixture.ts lives in the "tests/" folder and imports from here.
//   Keeping this thin wrapper here makes the import paths clean and avoids
//   deeply nested relative paths like "../../utils/jira-xray/xray-state".
// =============================================================================

export { appendTestResult } from '../utils/jira-xray/xray-state';
