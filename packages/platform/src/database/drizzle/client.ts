// ---------------------------------------------------------------------------
// Database client (Drizzle + Neon serverless HTTP)
// ---------------------------------------------------------------------------

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema/index.js'

export type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>

// Module-level database instance — set via initDrizzle()
let _db: DrizzleDatabase | null = null

/**
 * Initialize the Drizzle database with a Neon serverless connection.
 *
 * @param connectionString - PostgreSQL connection string (e.g. from Neon)
 */
export function initDrizzle(connectionString: string): DrizzleDatabase {
  if (_db) return _db

  const sql = neon(connectionString)
  _db = drizzle({ client: sql, schema })
  return _db
}

/** Get the current database instance. Throws if not initialized. */
export function getDb(): DrizzleDatabase {
  if (!_db) throw new Error('Drizzle database not initialized. Call initDrizzle(connectionString) first.')
  return _db
}
