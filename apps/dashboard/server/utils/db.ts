// ---------------------------------------------------------------------------
// Drizzle D1 utility — provides typed database access
// ---------------------------------------------------------------------------

import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

export { schema }

/**
 * Get the Drizzle ORM instance backed by D1.
 *
 * Tries hubDatabase() (NuxtHub) first, falls back to raw D1 binding.
 */
export function useDB() {
  let d1: any

  // Try NuxtHub's managed helper first
  try {
    d1 = hubDatabase()
  }
  catch {
    // Fall back to raw Cloudflare D1 binding
    const event = useEvent()
    d1 = (event.context.cloudflare?.env as any)?.DB
  }

  if (!d1) {
    throw new Error(
      'D1 database not found. Ensure hub.database is enabled or a D1 binding named "DB" is configured.',
    )
  }

  return drizzle(d1, { schema })
}
