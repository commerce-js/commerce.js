// ---------------------------------------------------------------------------
// Database client (Drizzle + better-sqlite3)
// ---------------------------------------------------------------------------

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema/index.js'

export type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>

// Module-level database instance — set via initDrizzle()
let _db: DrizzleDatabase | null = null

/**
 * Initialize the Drizzle database.
 *
 * @param url - SQLite database path. Use ':memory:' for in-memory (tests),
 *              or a file path like './store.db' for persistent storage.
 */
export function initDrizzle(url: string = ':memory:'): DrizzleDatabase {
  const sqlite = new Database(url)

  // Enable WAL mode for better concurrent read performance
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  _db = drizzle(sqlite, { schema })
  return _db
}

/** Get the current database instance. Throws if not initialized. */
export function getDb(): DrizzleDatabase {
  if (!_db) throw new Error('Drizzle database not initialized. Call initDrizzle() first.')
  return _db
}
