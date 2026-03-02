// =============================================================================
// utils/database/test-data-manager.ts — DATABASE / TEST DATA UTILITY
// =============================================================================
// PURPOSE:
//   Manages test data for your tests — seeding data before tests, cleaning
//   up after tests, and fetching data for assertions.
//
// WHY DO YOU NEED TEST DATA MANAGEMENT?
//   Real-world tests often need:
//     - A user to already exist in the database before testing login
//     - An order to exist before testing "View Order History"
//     - Data to be cleaned up after tests so the database stays tidy
//
//   Without test data management, your tests rely on whatever data happens
//   to be in the database, which is fragile and unreliable.
//
// HOW THIS UTILITY WORKS:
//   It provides a simple interface to:
//     1. SEED data   → Insert known test data before tests run
//     2. QUERY data  → Check data in the database for assertions
//     3. CLEANUP     → Remove test data after tests finish
//
// SUPPORTED DATABASES:
//   This is a "pluggable" design. The actual database connection logic is
//   in separate adapter files. You can add adapters for:
//     - PostgreSQL, MySQL, MongoDB, SQLite, etc.
//
// WHEN IS THIS CALLED?
//   - global-setup.ts:    SEED test data before tests start
//   - Inside tests:       QUERY data to verify test outcomes
//   - global-teardown.ts: CLEANUP test data after all tests finish
//
// HOW TO ENABLE:
//   1. Set DB_ENABLED=true in .env
//   2. Configure DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in .env
//   3. The framework checks isDbConfigured() and skips gracefully if false
// =============================================================================

import { config } from '../../config/environment';
import { logger } from '../helpers/logger';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Represents a piece of test data that was seeded into the database.
 * Tracked so we can clean it up later.
 */
export interface SeededRecord {
  table:      string;      // Which database table (e.g., "users", "orders")
  id:         string;      // The primary key of the inserted record
  createdAt:  string;      // When it was seeded (ISO timestamp)
  label:      string;      // Human-readable description (e.g., "Test user for TC01")
}

/**
 * Represents the result of a test data operation.
 */
export interface TestDataResult {
  success:    boolean;
  message:    string;
  data?:      any;           // Optional returned data (e.g., the inserted record)
}

// In-memory tracker of all records seeded during this test run
// Used for cleanup in teardown
const seededRecords: SeededRecord[] = [];

// =============================================================================
// FUNCTION: isDbConfigured
// =============================================================================
// PURPOSE:
//   Checks whether database integration is enabled and properly configured.
//   Returns false if DB is disabled or has placeholder values.
//   This lets the framework skip database operations gracefully.
// =============================================================================
export function isDbConfigured(): boolean {
  return (
    config.database.enabled &&
    config.database.host !== 'localhost-placeholder' &&
    config.database.name !== ''
  );
}

// =============================================================================
// FUNCTION: seedTestData
// =============================================================================
// PURPOSE:
//   Inserts known test data into the database before tests run.
//   This ensures tests have predictable, reliable data to work with.
//
// EXAMPLE:
//   await seedTestData('users', {
//     username: 'testuser_automation',
//     email:    'test@automation.com',
//     password: 'hashedpassword123',
//   }, 'Test user for login tests');
//
// PARAMETERS:
//   - table:  The database table to insert into
//   - data:   The record fields and values
//   - label:  A human-readable description for logging
// =============================================================================
export async function seedTestData(
  table: string,
  data:  Record<string, any>,
  label: string
): Promise<TestDataResult> {
  if (!isDbConfigured()) {
    logger.warn('Database not configured. Skipping seed operation.');
    return { success: false, message: 'Database not configured' };
  }

  try {
    logger.step(`Seeding test data into "${table}": ${label}`);

    // ─────────────────────────────────────────────────────────────────────
    // 🔌 PLUG YOUR DATABASE CLIENT HERE
    // ─────────────────────────────────────────────────────────────────────
    // Replace the code below with your actual database insert logic.
    // Examples:
    //
    //   PostgreSQL (using 'pg' package):
    //     const { Pool } = require('pg');
    //     const pool = new Pool({ host: config.database.host, ... });
    //     const result = await pool.query(
    //       `INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${...}) RETURNING id`
    //     );
    //     const insertedId = result.rows[0].id;
    //
    //   MongoDB (using 'mongodb' package):
    //     const { MongoClient } = require('mongodb');
    //     const client = new MongoClient(config.database.host);
    //     const db = client.db(config.database.name);
    //     const result = await db.collection(table).insertOne(data);
    //     const insertedId = result.insertedId.toString();
    //
    //   MySQL (using 'mysql2' package):
    //     const mysql = require('mysql2/promise');
    //     const connection = await mysql.createConnection({ host: config.database.host, ... });
    //     const [result] = await connection.execute(`INSERT INTO ${table} SET ?`, data);
    //     const insertedId = result.insertId.toString();
    // ─────────────────────────────────────────────────────────────────────

    // PLACEHOLDER: Simulating a successful insert
    const insertedId = `test_${Date.now()}`;

    // Track this record for cleanup later
    seededRecords.push({
      table,
      id: insertedId,
      createdAt: new Date().toISOString(),
      label,
    });

    logger.pass(`Seeded: [${table}] ${label} (id: ${insertedId})`);
    return { success: true, message: `Inserted into ${table}`, data: { id: insertedId } };

  } catch (error: any) {
    logger.error(`Failed to seed data into "${table}": ${error.message}`);
    return { success: false, message: error.message };
  }
}

// =============================================================================
// FUNCTION: queryTestData
// =============================================================================
// PURPOSE:
//   Queries the database to fetch data for test assertions.
//   For example, after a test creates an order via the UI, you can query
//   the database to verify the order was actually saved correctly.
//
// EXAMPLE:
//   const result = await queryTestData('orders', { userId: '12345' });
//   expect(result.data.length).toBeGreaterThan(0);
// =============================================================================
export async function queryTestData(
  table: string,
  where: Record<string, any>
): Promise<TestDataResult> {
  if (!isDbConfigured()) {
    return { success: false, message: 'Database not configured' };
  }

  try {
    logger.step(`Querying "${table}" where ${JSON.stringify(where)}`);

    // 🔌 PLUG YOUR DATABASE QUERY HERE (same pattern as seedTestData)
    // PLACEHOLDER:
    const mockResult: any[] = [];

    logger.info(`Query returned ${mockResult.length} record(s)`);
    return { success: true, message: 'Query successful', data: mockResult };

  } catch (error: any) {
    logger.error(`Failed to query "${table}": ${error.message}`);
    return { success: false, message: error.message };
  }
}

// =============================================================================
// FUNCTION: cleanupTestData
// =============================================================================
// PURPOSE:
//   Deletes all test data that was seeded during this test run.
//   Called from global-teardown.ts to leave the database clean.
//
// HOW IT WORKS:
//   Loops through all records tracked in seededRecords[] and deletes each one.
//   This ensures tests don't leave garbage data behind.
// =============================================================================
export async function cleanupTestData(): Promise<TestDataResult> {
  if (!isDbConfigured()) {
    return { success: false, message: 'Database not configured' };
  }

  if (seededRecords.length === 0) {
    logger.info('No test data to clean up.');
    return { success: true, message: 'Nothing to clean up' };
  }

  try {
    logger.step(`Cleaning up ${seededRecords.length} seeded record(s)...`);

    for (const record of seededRecords) {
      // 🔌 PLUG YOUR DATABASE DELETE HERE
      // Example: await pool.query(`DELETE FROM ${record.table} WHERE id = $1`, [record.id]);
      logger.info(`  Deleted: [${record.table}] ${record.label} (id: ${record.id})`);
    }

    const count = seededRecords.length;
    seededRecords.length = 0; // Clear the tracker

    logger.pass(`Cleaned up ${count} record(s).`);
    return { success: true, message: `Cleaned up ${count} records` };

  } catch (error: any) {
    logger.error(`Cleanup failed: ${error.message}`);
    return { success: false, message: error.message };
  }
}

// =============================================================================
// FUNCTION: getSeededRecords
// =============================================================================
// PURPOSE:
//   Returns the list of all records that were seeded during this run.
//   Useful for debugging or reporting.
// =============================================================================
export function getSeededRecords(): SeededRecord[] {
  return [...seededRecords]; // Return a copy so caller can't modify the original
}
