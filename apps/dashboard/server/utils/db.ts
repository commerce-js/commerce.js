// ---------------------------------------------------------------------------
// Control DB — TODO (fly/eaas Step 2)
// ---------------------------------------------------------------------------
//
// On the fly/eaas branch the dashboard's control database is migrating from
// Cloudflare D1 + Drizzle to Neon Postgres + Prisma. This file is a stub for
// Phase 1 (branch + preset + Docker + fly.toml) and will be rewritten in
// Step 2 ("Control DB — D1 to Prisma/Neon").
//
// See `.plans/fly-migration-plan.md` → Step 2 for the target shape:
//
//   import { PrismaClient } from '../generated/prisma'
//   const prisma = new PrismaClient({
//     datasources: { db: { url: process.env.CONTROL_DATABASE_URL } },
//   })
//   export { prisma }
//
// Until then, any caller of `useDB()` will throw at runtime. The legacy
// Drizzle schema is re-exported so that existing D1-era API routes can still
// compile — they will be re-implemented against Prisma in Step 2.
// ---------------------------------------------------------------------------

import * as schema from '../database/schema'

export { schema }

export function useDB(): never {
  throw new Error(
    'Control DB not initialized. fly/eaas Step 2 has not been completed yet — '
    + 'see .plans/fly-migration-plan.md.',
  )
}
