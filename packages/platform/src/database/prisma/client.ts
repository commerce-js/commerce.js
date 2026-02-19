// ---------------------------------------------------------------------------
// Prisma client — singleton pattern (PostgreSQL via Neon adapter)
// ---------------------------------------------------------------------------

import { PrismaClient } from './generated/client.js'
import { Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

// Module-level client instance — set via initPrisma()
let _prisma: InstanceType<typeof PrismaClient> | null = null

/**
 * Initialize the Prisma client with the Neon serverless adapter.
 *
 * @param connectionString - PostgreSQL connection string (e.g. from Neon)
 */
export function initPrisma(connectionString: string) {
  if (_prisma) return _prisma

  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool as any)
  _prisma = new PrismaClient({ adapter })
  return _prisma
}

/** Get the current Prisma client. Throws if not initialized. */
export function getDb() {
  if (!_prisma) throw new Error('Prisma client not initialized. Call initPrisma(connectionString) first.')
  return _prisma
}

/** Prisma client type — for consumers who need to type-hint the client. */
export type PrismaDatabase = InstanceType<typeof PrismaClient>
