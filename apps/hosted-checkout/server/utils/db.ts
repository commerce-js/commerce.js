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
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required for cart-based checkout')
  }
  initDrizzle(config.databaseUrl)
  initialized = true
}
