// =============================================================================
// utils/helpers/test-data-loader.ts — DATA-DRIVEN TEST DATA LOADER
// =============================================================================
// PURPOSE:
//   Loads test data from external YAML files so tests are DATA-DRIVEN.
//   Instead of hardcoding values in test files, each test reads its inputs
//   from a YAML file in the test-data/ folder.
//
// WHY DATA-DRIVEN TESTING?
//   ┌────────────────────────────────────────────────────────────────────┐
//   │  BEFORE (hardcoded):                                               │
//   │    const username = 'tomsmith';                                    │
//   │    const password = 'SuperSecretPassword!';                        │
//   │                                                                    │
//   │  AFTER (data-driven):                                              │
//   │    const td = getTestData('PROJ-101');                             │
//   │    const username = td.data.username;                              │
//   │    const password = td.data.password;                              │
//   │                                                                    │
//   │  BENEFITS:                                                         │
//   │    ✅ Change test data WITHOUT modifying test code                 │
//   │    ✅ Same tests can run with different data sets (environments)   │
//   │    ✅ QA can update data in YAML without knowing TypeScript        │
//   │    ✅ Test case names and XRAY keys are centralized                │
//   │    ✅ Easy to add new test cases — just add YAML entries           │
//   └────────────────────────────────────────────────────────────────────┘
//
// SUPPORTED FILE FORMAT: YAML
//   YAML was chosen over CSV/JSON because:
//     - More readable than JSON (no curly braces, no quotes on keys)
//     - Supports nested objects (CSV can't)
//     - Supports comments (JSON can't, CSV can't)
//     - Widely used in CI/CD (GitHub Actions, Docker Compose, Kubernetes)
//
// ENVIRONMENT VARIABLE SUBSTITUTION:
//   Use ${ENV:VARIABLE_NAME} in YAML values to reference .env variables:
//     password: "${ENV:TEST_PASSWORD}"
//   The loader replaces these at runtime with the actual env value.
//
// USAGE IN TESTS:
//   import { getTestData, loadTestDataFile } from '../utils/helpers/test-data-loader';
//
//   // Load all test data from a YAML file
//   const allData = loadTestDataFile('login-tests.yaml');
//
//   // Get data for a specific XRAY test case
//   const td = getTestData('login-tests.yaml', 'PROJ-101');
//   console.log(td.testCase);       // "TC01: Valid credentials should log the user in"
//   console.log(td.data.username);   // "tomsmith"
//   console.log(td.data.password);   // "SuperSecretPassword!"
//
// FILE LOCATION:
//   Test data files live in: <project-root>/test-data/
//   Supported extensions: .yaml, .yml
// =============================================================================

import * as fs   from 'fs';
import * as path from 'path';
import { parse }  from 'yaml';
import { logger } from './logger';

// =============================================================================
// TYPES
// =============================================================================

/**
 * A single test case entry from a YAML data file.
 *
 * EXAMPLE (from login-tests.yaml):
 *   PROJ-101:
 *     testCase: "TC01: Valid credentials should log the user in"
 *     data:
 *       username: "tomsmith"
 *       password: "SuperSecretPassword!"
 *
 * Becomes:
 *   { testCase: "TC01: ...", data: { username: "tomsmith", password: "..." } }
 */
export interface TestDataEntry {
  /** Friendly test case name (shown in logs/reports) */
  testCase: string;
  /** Key-value pairs of test inputs and expected results */
  data: Record<string, unknown>;
}

/**
 * The full parsed YAML file — a map of XRAY keys → TestDataEntry.
 *
 * EXAMPLE:
 *   {
 *     'PROJ-101': { testCase: '...', data: { ... } },
 *     'PROJ-102': { testCase: '...', data: { ... } },
 *   }
 */
export type TestDataFile = Record<string, TestDataEntry>;

// =============================================================================
// CACHE — avoid re-reading the same YAML file multiple times
// =============================================================================
const fileCache = new Map<string, TestDataFile>();

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Load and parse an entire YAML test data file.
 *
 * @param fileName  Name of the YAML file (e.g., 'login-tests.yaml')
 *                  The file is looked up in <project-root>/test-data/
 * @returns         A map of XRAY key → TestDataEntry
 *
 * @example
 *   const allLoginData = loadTestDataFile('login-tests.yaml');
 *   // Returns: { 'PROJ-101': { testCase: '...', data: { ... } }, ... }
 */
export function loadTestDataFile(fileName: string): TestDataFile {
  // Check cache first
  if (fileCache.has(fileName)) {
    return fileCache.get(fileName)!;
  }

  const filePath = resolveTestDataPath(fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Test data file not found: ${filePath}\n` +
      `  → Create it in the test-data/ folder at the project root.\n` +
      `  → See test-data/login-tests.yaml for an example.`
    );
  }

  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = parse(rawContent) as TestDataFile;

  // Substitute environment variables in all string values
  const resolved = resolveEnvVariables(parsed);

  // Cache for subsequent calls
  fileCache.set(fileName, resolved);

  logger.debug(`📂 Loaded test data: ${fileName} (${Object.keys(resolved).length} test case(s))`);

  return resolved;
}

/**
 * Get the test data for a specific XRAY test case from a YAML file.
 *
 * @param fileName  Name of the YAML file (e.g., 'login-tests.yaml')
 * @param xrayKey   The XRAY test case key (e.g., 'PROJ-101')
 * @returns         The TestDataEntry for that test case
 *
 * @throws          Error if the file or key is not found
 *
 * @example
 *   const td = getTestData('login-tests.yaml', 'PROJ-101');
 *   console.log(td.testCase);       // "TC01: Valid credentials..."
 *   console.log(td.data.username);   // "tomsmith"
 */
export function getTestData(fileName: string, xrayKey: string): TestDataEntry {
  const allData = loadTestDataFile(fileName);

  if (!allData[xrayKey]) {
    throw new Error(
      `Test data not found for XRAY key "${xrayKey}" in file "${fileName}".\n` +
      `  → Available keys: ${Object.keys(allData).join(', ')}\n` +
      `  → Add a "${xrayKey}" entry to test-data/${fileName}`
    );
  }

  return allData[xrayKey];
}

/**
 * Get all XRAY keys defined in a test data file.
 * Useful for generating test permutations or listing available test cases.
 *
 * @param fileName  Name of the YAML file
 * @returns         Array of XRAY keys (e.g., ['PROJ-101', 'PROJ-102', 'PROJ-103'])
 */
export function getTestDataKeys(fileName: string): string[] {
  const allData = loadTestDataFile(fileName);
  return Object.keys(allData);
}

/**
 * Clear the internal file cache.
 * Call this if you modify YAML files at runtime and need a fresh read.
 */
export function clearTestDataCache(): void {
  fileCache.clear();
}

// =============================================================================
// PRIVATE HELPERS
// =============================================================================

/**
 * Resolves the absolute path to a test data file.
 * Looks in <project-root>/test-data/ by default.
 */
function resolveTestDataPath(fileName: string): string {
  return path.resolve(process.cwd(), 'test-data', fileName);
}

/**
 * Recursively walks through the parsed YAML object and replaces any
 * ${ENV:VARIABLE_NAME} patterns with the actual environment variable value.
 *
 * EXAMPLE:
 *   Input:  { password: "${ENV:TEST_PASSWORD}" }
 *   Output: { password: "actual-password-from-env" }
 *
 * If the env variable is not set, the placeholder remains as-is and a
 * warning is logged.
 */
function resolveEnvVariables(obj: TestDataFile): TestDataFile {
  const envPattern = /\$\{ENV:([^}]+)\}/g;

  function resolveValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.replace(envPattern, (_match, varName: string) => {
        const envValue = process.env[varName];
        if (envValue === undefined) {
          logger.warn(`⚠ Environment variable "${varName}" is not set (used in test data YAML).`);
          return `\${ENV:${varName}}`; // leave placeholder as-is
        }
        return envValue;
      });
    }

    if (Array.isArray(value)) {
      return value.map(resolveValue);
    }

    if (value !== null && typeof value === 'object') {
      const resolved: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        resolved[k] = resolveValue(v);
      }
      return resolved;
    }

    return value; // numbers, booleans, null — return as-is
  }

  return resolveValue(obj) as TestDataFile;
}
