// ---------------------------------------------------------------------------
// Prisma client factory — connection-string-scoped, LRU cached
//
// Two access patterns are supported:
//
//   1. Single-tenant singleton (main branch + fly/eaas single-merchant
//      legacy path): `initPrisma(url)` sets a module-level default client;
//      `getDb()` returns it. Mirrors the Drizzle client shape so domain
//      queries work unchanged when the active driver is swapped.
//
//   2. Multi-tenant per-merchant cache (fly/eaas Step 4+): call
//      `getPrismaClient(connectionString)` directly with each merchant's
//      Neon branch URL. Cached for the lifetime of the process; evict via
//      `disconnectPrismaClient(url)` on deprovision.
//
// NOTE: Requires `pnpm --filter @commercejs/platform run prisma:generate`
// before this file can be compiled. The generated client lives in
// ./generated/.
// ---------------------------------------------------------------------------

import { PrismaClient } from './generated/client.js'
import { PrismaNeon } from '@prisma/adapter-neon'

/** Clients keyed by connection string — one client per merchant DB */
const clientCache = new Map<string, PrismaClient>()

/** Module-level singleton — set by initPrisma(), read by getDb() */
let _db: PrismaClient | null = null

/**
 * Get or create a PrismaClient for the given Neon connection string.
 * Safe to call on every request — returns the cached instance after first call.
 */
export function getPrismaClient(connectionString: string): PrismaClient {
  const cached = clientCache.get(connectionString)
  if (cached) return cached

  const adapter = new PrismaNeon({ connectionString })
  const client = new PrismaClient({ adapter } as never)
  clientCache.set(connectionString, client)
  return client
}

/**
 * Initialize the default single-tenant client. Later `getDb()` calls return it.
 * Idempotent — calling again with a new URL creates a fresh client for that
 * URL and re-binds the default.
 */
export function initPrisma(connectionString: string): PrismaClient {
  _db = getPrismaClient(connectionString)
  return _db
}

/**
 * Get the default single-tenant client. Throws if not initialized.
 * Matches the Drizzle client's `getDb()` contract so domain queries can
 * swap drivers without being touched.
 */
export function getDb(): PrismaClient {
  if (!_db) {
    throw new Error(
      'Prisma client not initialized. Call initPrisma(connectionString) first.',
    )
  }
  return _db
}

/** Reset the default singleton (for tests). Does not touch the URL cache. */
export function resetDb(): void {
  _db = null
}

/**
 * Disconnect and evict a client from the cache.
 * Call when a merchant DB is deprovisioned or after an idle timeout.
 */
export async function disconnectPrismaClient(connectionString: string): Promise<void> {
  const client = clientCache.get(connectionString)
  if (client) {
    await client.$disconnect()
    clientCache.delete(connectionString)
  }
}

/**
 * Disconnect all cached clients — call during graceful shutdown.
 */
export async function disconnectAll(): Promise<void> {
  await Promise.all(
    [...clientCache.entries()].map(async ([key, client]) => {
      await client.$disconnect()
      clientCache.delete(key)
    }),
  )
  _db = null
}

/** Prisma client type — for domain functions and server routes */
export type PrismaDatabase = PrismaClient
