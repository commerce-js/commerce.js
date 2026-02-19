// ---------------------------------------------------------------------------
// Database client (Drizzle + Neon serverless HTTP)
// ---------------------------------------------------------------------------

import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema/index.js'

export type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>

// Module-level database instance — set via initDrizzle()
let _db: DrizzleDatabase | null = null

/**
 * Initialize the Drizzle database with a Neon serverless connection.
 *
 * Uses the simplified drizzle(connectionString) API — Drizzle creates the
 * Neon HTTP client internally, avoiding v1.x tagged-template API issues.
 *
 * @param connectionString - PostgreSQL connection string (e.g. from Neon)
 */
export function initDrizzle(connectionString: string): DrizzleDatabase {
  if (_db) return _db

  _db = drizzle(connectionString, { schema })
  return _db
}

/** Get the current database instance. Throws if not initialized. */
export function getDb(): DrizzleDatabase {
  if (!_db) throw new Error('Drizzle database not initialized. Call initDrizzle(connectionString) first.')
  return _db
}
