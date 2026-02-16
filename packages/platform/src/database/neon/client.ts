// ---------------------------------------------------------------------------
// Neon Postgres client — Prisma with @prisma/adapter-neon for serverless
// ---------------------------------------------------------------------------

import { PrismaClient } from '../prisma/generated/client.js'

/**
 * Initialize a Prisma client backed by Neon Postgres (serverless).
 *
 * Uses `@prisma/adapter-neon` + `@neondatabase/serverless` which provides
 * WebSocket-based connections ideal for edge runtimes (Cloudflare Workers).
 *
 * @example
 * ```ts
 * import { initPrismaNeon, getNeonDb } from '@commercejs/platform/neon'
 *
 * await initPrismaNeon(process.env.DATABASE_URL!)
 * const db = getNeonDb()
 * ```
 */
export async function initPrismaNeon(connectionString: string) {
  // Dynamic import to keep @neondatabase/serverless optional
  const { Pool } = await import('@neondatabase/serverless')
  const { PrismaNeon } = await import('@prisma/adapter-neon')

  const pool = new Pool({ connectionString })
  // Type assertion: Pool is the correct runtime type but has TypeScript
  // signature mismatch with @prisma/adapter-neon's PoolConfig typedef
  const adapter = new PrismaNeon(pool as any)

  _neonPrisma = new PrismaClient({ adapter })
  return _neonPrisma
}

// Module-level client instance — set via initPrismaNeon()
let _neonPrisma: InstanceType<typeof PrismaClient> | null = null

/** Get the current Neon-backed Prisma client. Throws if not initialized. */
export function getNeonDb() {
  if (!_neonPrisma) {
    throw new Error(
      'Neon Prisma client not initialized. Call initPrismaNeon(connectionString) first.',
    )
  }
  return _neonPrisma
}

/** Neon Prisma client type */
export type NeonDatabase = InstanceType<typeof PrismaClient>
