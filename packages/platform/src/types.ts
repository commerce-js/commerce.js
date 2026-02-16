// ---------------------------------------------------------------------------
// Platform configuration types
// ---------------------------------------------------------------------------

/** Database driver type */
export type DatabaseDriver = 'sqlite' | 'neon'

/** Platform configuration */
export interface PlatformConfig {
  /** Default currency for the store (default: 'SAR') */
  currency?: string
  /** Default locale (default: 'en') */
  locale?: string
  /**
   * Database driver to use:
   * - `'sqlite'` — SQLite via better-sqlite3 (default for local dev)
   * - `'neon'` — Neon Postgres via @prisma/adapter-neon (cloud deployments)
   * - `undefined` — auto-detect from DATABASE_URL env var
   */
  driver?: DatabaseDriver
  /**
   * Database connection string.
   * - For SQLite: file path or ':memory:' (default: ':memory:')
   * - For Neon: postgres:// connection string (required)
   */
  connectionString?: string
}
