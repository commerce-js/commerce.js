// ---------------------------------------------------------------------------
// Platform configuration types
// ---------------------------------------------------------------------------

/** Platform configuration */
export interface PlatformConfig {
  /** Default currency for the store (default: 'SAR') */
  currency?: string
  /** Default locale (default: 'en') */
  locale?: string
  /**
   * PostgreSQL connection string (e.g. from Neon).
   * Falls back to DATABASE_URL env var if not provided.
   */
  connectionString?: string
}
