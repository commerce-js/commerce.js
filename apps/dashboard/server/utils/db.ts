// ---------------------------------------------------------------------------
// Drizzle D1 utility — provides typed database access via NuxtHub
// ---------------------------------------------------------------------------

import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

export { schema }

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

/**
 * Get the Drizzle ORM instance backed by NuxtHub D1.
 * Uses the `hubDatabase()` binding provided by @nuxthub/core.
 */
export function useDB() {
  if (!_db) {
    _db = drizzle(hubDatabase(), { schema })
  }
  return _db
}
