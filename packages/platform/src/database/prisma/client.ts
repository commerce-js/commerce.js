// ---------------------------------------------------------------------------
// Prisma client factory — connection-string-scoped, LRU cached
//
// Supports both single-tenant (main branch) and multi-tenant (fly/eaas) use.
// Each unique connection string gets its own PrismaClient instance, cached for
// the lifetime of the process. Call disconnectPrismaClient() on idle/deprovisioned.
//
// NOTE: Requires `pnpm --filter @commercejs/platform run prisma:generate` before
// this file can be compiled. The generated client lives in ./generated/.
// ---------------------------------------------------------------------------

import { PrismaClient } from './generated/client.js'
import { PrismaNeon } from '@prisma/adapter-neon'

/** Clients keyed by connection string — one client per merchant DB */
const clientCache = new Map<string, PrismaClient>()

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
 * Alias for single-tenant use (main branch).
 * Initializes and caches a client for the given connection string.
 */
export function initPrisma(connectionString: string): PrismaClient {
  return getPrismaClient(connectionString)
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
}

/** Prisma client type — for domain functions and server routes */
export type PrismaDatabase = PrismaClient
