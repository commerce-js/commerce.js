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

import { AsyncLocalStorage } from 'node:async_hooks'
import { PrismaClient } from './generated/client.js'
import { PrismaNeon } from '@prisma/adapter-neon'

/** Clients keyed by connection string — one client per merchant DB */
const clientCache = new Map<string, PrismaClient>()

/** Module-level singleton — set by initPrisma(), read by getDb() as a fallback */
let _db: PrismaClient | null = null

/**
 * Per-request tenant store. Nitro middleware on the fly/eaas branch calls
 * `bindDb(client)` inside the request's async frame so every downstream
 * `getDb()` returns that merchant's Prisma client — even though the domain
 * queries themselves don't accept a `db` parameter. Safe under concurrent
 * requests because AsyncLocalStorage is scoped to the async context tree.
 */
const tenantStore = new AsyncLocalStorage<PrismaClient>()

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
 * Get the current request's Prisma client. Resolution order:
 *   1. The tenant-scoped client set by `bindDb()` in middleware.
 *   2. The module-level singleton set by `initPrisma()`.
 *   3. Throw.
 *
 * Matches the Drizzle client's `getDb()` contract so domain queries can
 * swap drivers without being touched.
 */
export function getDb(): PrismaClient {
  const scoped = tenantStore.getStore()
  if (scoped) return scoped
  if (_db) return _db
  throw new Error(
    'Prisma client not initialized. Call initPrisma(connectionString) for '
    + 'single-tenant use, or bindDb(merchantClient) inside a per-request '
    + 'async frame for multi-tenant (fly/eaas) use.',
  )
}

/**
 * Bind a Prisma client to the current async context — subsequent `getDb()`
 * calls in the same async tree return this client. Uses
 * `AsyncLocalStorage.enterWith` so framework middleware can set the client
 * without needing to wrap the handler's execution in a callback.
 *
 * Safe under concurrent requests: each request has its own async context,
 * so bindings don't leak between tenants.
 */
export function bindDb(client: PrismaClient): void {
  tenantStore.enterWith(client)
}

/**
 * Run a callback with a specific tenant client bound. Use when you control
 * the callback's execution (e.g. BullMQ job handlers); use `bindDb()` when
 * the framework drives the async frame (e.g. Nitro middleware).
 */
export function runWithDb<T>(client: PrismaClient, fn: () => T): T {
  return tenantStore.run(client, fn)
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
