// ---------------------------------------------------------------------------
// Drizzle D1 utility — provides typed database access via NuxtHub
// ---------------------------------------------------------------------------

import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

export { schema }

/**
 * Get the Drizzle ORM instance backed by NuxtHub D1.
 *
 * Uses NuxtHub's hubDatabase() helper which works in both:
 * - Development: proxied through NuxtHub admin
 * - Production: direct D1 binding on Cloudflare Pages
 */
export function useDB() {
  const d1 = hubDatabase()
  return drizzle(d1, { schema })
}
