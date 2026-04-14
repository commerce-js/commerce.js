// ---------------------------------------------------------------------------
// Control DB — Prisma client (singleton)
// ---------------------------------------------------------------------------
//
// Wraps a single PrismaClient bound to CONTROL_DATABASE_URL via the Neon
// HTTP/WS adapter. The control DB stores platform metadata (Merchant,
// ApiKey, Domain, DashboardUser) — see prisma/schema.prisma.
//
// Per-merchant commerce data lives in separate Neon branches and is
// accessed through `packages/platform`'s own per-tenant Prisma cache.
//
// NOTE: Requires `npx prisma generate` (in apps/dashboard) before this
// file can be compiled. The generated client lives in
// ./generated/prisma/.
// ---------------------------------------------------------------------------

import process from 'node:process'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '../generated/prisma/client'

let cached: PrismaClient | null = null

/**
 * Returns the singleton control-DB Prisma client. Lazy-initialized on first
 * call so build-time imports don't fail when CONTROL_DATABASE_URL is unset.
 */
export function useDB(): PrismaClient {
  if (cached) return cached

  const url = process.env.CONTROL_DATABASE_URL
  if (!url) {
    throw new Error(
      'CONTROL_DATABASE_URL is not set. Configure it in the Fly.io app '
      + 'environment (or .env locally) before calling useDB().',
    )
  }

  const adapter = new PrismaNeon({ connectionString: url })
  cached = new PrismaClient({ adapter } as never)
  return cached
}

/** Disconnect on graceful shutdown (e.g. SIGTERM in a long-running worker). */
export async function disconnectDB(): Promise<void> {
  if (cached) {
    await cached.$disconnect()
    cached = null
  }
}
