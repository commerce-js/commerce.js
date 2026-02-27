// ---------------------------------------------------------------------------
// Drizzle D1 utility — provides typed database access via NuxtHub
// ---------------------------------------------------------------------------

import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

export { schema }

/**
 * Get the Drizzle ORM instance backed by NuxtHub D1.
 *
 * Accesses the D1 binding from the Cloudflare environment context.
 * Creates a new Drizzle instance per-request (D1 bindings are per-request
 * in the Cloudflare Workers runtime).
 */
export function useDB() {
  const event = useEvent()
  const d1 = (event.context.cloudflare?.env as any)?.DB
  if (!d1) {
    throw new Error(
      'D1 database binding not found. Ensure NuxtHub is configured with hub.database: true '
      + 'and the wrangler.jsonc has a d1_databases binding named "DB".',
    )
  }
  return drizzle(d1, { schema })
}
