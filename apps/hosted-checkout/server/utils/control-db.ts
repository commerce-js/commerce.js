// ---------------------------------------------------------------------------
// Control DB lookup — raw SQL via @neondatabase/serverless
// ---------------------------------------------------------------------------
// The hosted-checkout only needs one query against the control DB: find a
// merchant row by subdomain so the tenant middleware can connect to the
// merchant's Neon branch. Using raw SQL here is intentional — it avoids
// duplicating the dashboard's Prisma schema or generating a second client
// for a single SELECT.
// ---------------------------------------------------------------------------

import { neon } from '@neondatabase/serverless'

export interface MerchantRow {
  id: string
  subdomain: string
  database_url: string
  name: string
  currency: string
  locale: string
  status: string
}

let _sql: ReturnType<typeof neon> | null = null

function getSql(): ReturnType<typeof neon> {
  if (_sql) return _sql
  const config = useRuntimeConfig()
  const url = config.neonControlDbUrl || process.env.NEON_CONTROL_DB_URL || ''
  if (!url) {
    throw new Error(
      '[hosted-checkout] NEON_CONTROL_DB_URL is required for multi-tenant '
      + 'merchant resolution. Set it as a Fly secret or in runtimeConfig.',
    )
  }
  _sql = neon(url)
  return _sql
}

/**
 * Look up a merchant by subdomain in the control DB.
 * Returns null if the merchant doesn't exist or isn't active.
 */
export async function findMerchantBySubdomain(subdomain: string): Promise<MerchantRow | null> {
  const sql = getSql()
  const rows = await sql`
    SELECT id, subdomain, database_url, name, currency, locale, status
    FROM merchants
    WHERE subdomain = ${subdomain}
    LIMIT 1
  ` as unknown as MerchantRow[]

  if (rows.length === 0) return null

  const merchant = rows[0]
  if (!merchant.database_url) return null

  return merchant
}
