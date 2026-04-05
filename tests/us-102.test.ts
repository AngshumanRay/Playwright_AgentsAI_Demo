// =============================================================================
// tests/us-102.test.ts — US-102: Blog Posts API
// =============================================================================
// Auto-generated from: user-stories/US-102-api-posts.yaml
// Data source: test-data/api-tests.yaml
// Implementation: Fully automated against https://jsonplaceholder.typicode.com
// =============================================================================

import { test, expect } from '../utils/framework/xray-test-fixture';
import { enhancedLogger } from '../utils/helpers/enhanced-logger';
import { loadTestEntry } from '../utils/helpers/test-data-loader';

const DATA_FILE = 'api-tests.yaml';

test.describe('US-102: Blog Posts API', () => {

  // ── US-102.AC-1: GET single post returns valid response ──
  // Tags: Smoke, Regression
  test('US-102.AC-1: GET single post returns valid response',
    { annotation: { type: 'xray', description: 'US-102.AC-1' } },
    async ({ request, xrayTestKey }) => {
      const td = loadTestEntry(DATA_FILE, 'US-102.AC-1');
      if (!td.run) test.skip();

      enhancedLogger.section(`▶ Running: US-102.AC-1 | ${td.title}`);

      // Step 1: Send GET request to /posts/1
      enhancedLogger.step('Step 1: GET /posts/1', xrayTestKey);
      const response = await request.get(`${td.baseUrl}${td.endpoint}`);

      // Then: The response status is 200
      expect(response.status()).toBe(td.expectedStatus as number);

      // Then: The response body contains required fields
      const body = await response.json();
      for (const field of (td.expectedFields as string[])) {
        expect(body).toHaveProperty(field);
      }

      enhancedLogger.pass('US-102.AC-1 passed', xrayTestKey);
    }
  );

  // ── US-102.AC-2: POST creates a new blog post ──
  // Tags: Regression
  test('US-102.AC-2: POST creates a new blog post',
    { annotation: { type: 'xray', description: 'US-102.AC-2' } },
    async ({ request, xrayTestKey }) => {
      const td = loadTestEntry(DATA_FILE, 'US-102.AC-2');
      if (!td.run) test.skip();

      enhancedLogger.section(`▶ Running: US-102.AC-2 | ${td.title}`);

      // Step 1: Send POST request to /posts with payload
      enhancedLogger.step('Step 1: POST /posts', xrayTestKey);
      const payload = td.payload as Record<string, unknown>;
      const response = await request.post(`${td.baseUrl}${td.endpoint}`, {
        data: payload,
      });

      // Then: The response status is 201
      expect(response.status()).toBe(td.expectedStatus as number);

      // Then: The response body contains the submitted data with a new id
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body.title).toBe(payload.title);
      expect(body.body).toBe(payload.body);
      expect(body.userId).toBe(payload.userId);

      enhancedLogger.pass('US-102.AC-2 passed', xrayTestKey);
    }
  );

  // ── US-102.AC-3: GET user profile returns nested fields ──
  // Tags: Sanity, Regression
  test('US-102.AC-3: GET user profile returns nested fields',
    { annotation: { type: 'xray', description: 'US-102.AC-3' } },
    async ({ request, xrayTestKey }) => {
      const td = loadTestEntry(DATA_FILE, 'US-102.AC-3');
      if (!td.run) test.skip();

      enhancedLogger.section(`▶ Running: US-102.AC-3 | ${td.title}`);

      // Step 1: Send GET request to /users/1
      enhancedLogger.step('Step 1: GET /users/1', xrayTestKey);
      const response = await request.get(`${td.baseUrl}${td.endpoint}`);

      // Then: The response status is 200
      expect(response.status()).toBe(td.expectedStatus as number);

      // Then: The response body contains required fields
      const body = await response.json();
      for (const field of (td.expectedFields as string[])) {
        expect(body).toHaveProperty(field);
      }

      enhancedLogger.pass('US-102.AC-3 passed', xrayTestKey);
    }
  );
});
