// ---------------------------------------------------------------------------
// Prisma client — singleton pattern
// ---------------------------------------------------------------------------

import { PrismaClient } from './generated/client.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// Module-level client instance — set via initPrisma()
let _prisma: InstanceType<typeof PrismaClient> | null = null

/**
 * Initialize the Prisma client with SQLite (in-memory or file).
 *
 * @param url - SQLite path. Use ':memory:' for in-memory (tests),
 *              or a file path for persistent storage.
 */
export function initPrisma(url: string = ':memory:') {
  const adapter = new PrismaBetterSqlite3({ url })
  _prisma = new PrismaClient({ adapter })
  return _prisma
}

/** Get the current Prisma client. Throws if not initialized. */
export function getDb() {
  if (!_prisma) throw new Error('Prisma client not initialized. Call initPrisma() first.')
  return _prisma
}

/** Prisma client type — for consumers who need to type-hint the client. */
export type PrismaDatabase = InstanceType<typeof PrismaClient>
