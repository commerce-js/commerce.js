// ---------------------------------------------------------------------------
// Prisma client factory — cache identity + getDb() resolution precedence
//
// Offline: PrismaClient with the Neon driver adapter does not connect until
// the first query, so construction/caching/binding are testable without a DB.
//
// getDb() precedence under test (the multi-tenant safety contract):
//   1. registered event resolver (event.context.db) — per-request binding
//   2. AsyncLocalStorage scope (runWithDb)
//   3. module singleton (initPrisma)
//   4. throw
// ---------------------------------------------------------------------------

import { describe, it, expect, vi } from 'vitest'

const URL_A = 'postgresql://user:pass@host-a.neon.tech:5432/db'
const URL_B = 'postgresql://user:pass@host-b.neon.tech:5432/db'
const URL_C = 'postgresql://user:pass@host-c.neon.tech:5432/db'

async function freshModule() {
  vi.resetModules()
  return import('../client.js')
}

describe('getPrismaClient — connection-string cache', () => {
  it('returns the same instance for the same connection string', async () => {
    const mod = await freshModule()
    expect(mod.getPrismaClient(URL_A)).toBe(mod.getPrismaClient(URL_A))
  })

  it('returns different instances for different connection strings', async () => {
    const mod = await freshModule()
    expect(mod.getPrismaClient(URL_A)).not.toBe(mod.getPrismaClient(URL_B))
  })

  it('disconnectPrismaClient evicts from the cache', async () => {
    const mod = await freshModule()
    const a = mod.getPrismaClient(URL_A)
    await mod.disconnectPrismaClient(URL_A)
    expect(mod.getPrismaClient(URL_A)).not.toBe(a)
  })
})

describe('getDb — resolution precedence', () => {
  it('throws when nothing is bound', async () => {
    const mod = await freshModule()
    expect(() => mod.getDb()).toThrow()
  })

  it('falls back to the initPrisma singleton', async () => {
    const mod = await freshModule()
    const client = mod.initPrisma(URL_A)
    expect(mod.getDb()).toBe(client)
    mod.resetDb()
    expect(() => mod.getDb()).toThrow()
  })

  it('runWithDb scopes over the singleton', async () => {
    const mod = await freshModule()
    const fallback = mod.initPrisma(URL_A)
    const scoped = mod.getPrismaClient(URL_B)

    mod.runWithDb(scoped, () => {
      expect(mod.getDb()).toBe(scoped)
    })
    expect(mod.getDb()).toBe(fallback)
  })

  it('event resolver wins over runWithDb and the singleton', async () => {
    const mod = await freshModule()
    mod.initPrisma(URL_A)
    const scoped = mod.getPrismaClient(URL_B)
    const perEvent = mod.getPrismaClient(URL_C)

    mod.registerEventResolver(() => ({ context: { db: perEvent } }))
    mod.runWithDb(scoped, () => {
      expect(mod.getDb()).toBe(perEvent)
    })
  })

  it('isolates concurrent interleaved runWithDb contexts (no cross-tenant leaks)', async () => {
    const mod = await freshModule()
    const clientA = mod.getPrismaClient(URL_A)
    const clientB = mod.getPrismaClient(URL_B)
    const seen: Record<string, unknown[]> = { a: [], b: [] }

    await Promise.all([
      mod.runWithDb(clientA, async () => {
        seen.a!.push(mod.getDb())
        await new Promise(r => setTimeout(r, 10))
        seen.a!.push(mod.getDb())
      }),
      mod.runWithDb(clientB, async () => {
        seen.b!.push(mod.getDb())
        await new Promise(r => setTimeout(r, 5))
        seen.b!.push(mod.getDb())
      }),
    ])

    expect(seen.a).toEqual([clientA, clientA])
    expect(seen.b).toEqual([clientB, clientB])
  })

  it('isolates concurrent event contexts when the resolver returns per-task events', async () => {
    const mod = await freshModule()
    const clientA = mod.getPrismaClient(URL_A)
    const clientB = mod.getPrismaClient(URL_B)

    // Simulate Nitro's useEvent(): an AsyncLocalStorage of events.
    const { AsyncLocalStorage } = await import('node:async_hooks')
    const eventAls = new AsyncLocalStorage<{ context: { db: unknown } }>()
    mod.registerEventResolver(() => eventAls.getStore() as never)

    const seen: Record<string, unknown[]> = { a: [], b: [] }
    await Promise.all([
      eventAls.run({ context: { db: clientA } }, async () => {
        seen.a!.push(mod.getDb())
        await new Promise(r => setTimeout(r, 8))
        seen.a!.push(mod.getDb())
      }),
      eventAls.run({ context: { db: clientB } }, async () => {
        seen.b!.push(mod.getDb())
        await new Promise(r => setTimeout(r, 3))
        seen.b!.push(mod.getDb())
      }),
    ])

    expect(seen.a).toEqual([clientA, clientA])
    expect(seen.b).toEqual([clientB, clientB])
  })
})
