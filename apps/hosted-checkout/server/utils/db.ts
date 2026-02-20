// ---------------------------------------------------------------------------
// Server utility — initialize the shared Neon DB connection
// ---------------------------------------------------------------------------
// Uses @commercejs/platform's Drizzle client to access the shared database.
// Auto-initializes on first call, lazy singleton pattern.
// ---------------------------------------------------------------------------

import { initDrizzle } from '@commercejs/platform'

let initialized = false

export function ensureDb() {
  if (initialized) return
  const config = useRuntimeConfig()
  // Nuxt maps runtimeConfig.databaseUrl → NUXT_DATABASE_URL at runtime.
  // Fall back to DATABASE_URL for compatibility with standard naming.
  const dbUrl = config.databaseUrl || process.env.DATABASE_URL || ''
  if (!dbUrl) {
    throw new Error('DATABASE_URL is required for cart-based checkout')
  }
  initDrizzle(dbUrl)
  initialized = true
}
