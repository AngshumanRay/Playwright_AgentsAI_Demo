// =============================================================================
// utils/framework/xray-state-helper.ts — THIN WRAPPER FOR XRAY STATE
// =============================================================================
// PURPOSE:
//   This is a thin "bridge" file that re-exports the appendTestResult function
//   from utils/jira-xray/xray-state.ts.
//
//   WHY A SEPARATE FILE?
//   The xray-test-fixture.ts imports from here. Keeping this thin wrapper
//   makes the import paths clean and centralised.
// =============================================================================

export { appendTestResult, appendPerfData, appendA11yData, appendLogEntries } from '../jira-xray/xray-state';
