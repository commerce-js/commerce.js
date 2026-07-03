// ---------------------------------------------------------------------------
// Tenant resolution — offline tests (control DB mocked)
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'

const merchantFindUnique = vi.fn()
const merchantFindFirst = vi.fn()
const merchantFindMany = vi.fn()
const apiKeyFindMany = vi.fn()
const apiKeyUpdate = vi.fn().mockResolvedValue({})
const domainFindUnique = vi.fn()
const domainFindFirst = vi.fn()

vi.mock('../server/utils/db', () => ({
  useDB: () => ({
    merchant: { findUnique: merchantFindUnique, findFirst: merchantFindFirst, findMany: merchantFindMany },
    apiKey: { findMany: apiKeyFindMany, update: apiKeyUpdate },
    domain: { findUnique: domainFindUnique, findFirst: domainFindFirst },
  }),
}))

import {
  resolveMerchant,
  getMerchantConfig,
  invalidateMerchantCache,
  clearMerchantCache,
} from '../server/utils/tenant'

const MERCHANT = {
  id: 'm-1',
  name: 'Test Store',
  email: 'owner@test.com',
  subdomain: 'test-store',
  plan: 'pro',
  status: 'active',
  currency: 'SAR',
  locale: 'ar-SA',
  databaseUrl: 'postgresql://u:p@host/db',
  customDomain: null,
  trialEndsAt: null,
}

function makeEvent(headers: Record<string, string>): H3Event {
  return { node: { req: { headers } } } as unknown as H3Event
}

beforeEach(() => {
  vi.clearAllMocks()
  clearMerchantCache()
  merchantFindUnique.mockResolvedValue(null)
  merchantFindFirst.mockResolvedValue(null)
  merchantFindMany.mockResolvedValue([])
  apiKeyFindMany.mockResolvedValue([])
  domainFindUnique.mockResolvedValue(null)
  domainFindFirst.mockResolvedValue(null)
})

describe('resolveMerchant — API key path', () => {
  it('matches prefix lookup + sha256 hash of the full key', async () => {
    const plaintext = 'cjsab12cd34_deadbeefdeadbeefdeadbeefdeadbeef'
    const keyHash = createHash('sha256').update(plaintext).digest('hex')
    apiKeyFindMany.mockResolvedValue([{ id: 'k-1', keyHash, merchant: MERCHANT }])

    const resolution = await resolveMerchant(makeEvent({
      'x-commerce-key': plaintext,
      'host': 'unrelated.example.com',
    }))

    expect(resolution?.via).toBe('api-key')
    expect(resolution?.merchant.id).toBe('m-1')
    expect(apiKeyFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { keyPrefix: 'cjsab12cd34' },
    }))
  })

  it('rejects a key whose hash does not match (prefix collision / tamper)', async () => {
    apiKeyFindMany.mockResolvedValue([{ id: 'k-1', keyHash: 'not-the-hash', merchant: MERCHANT }])
    const resolution = await resolveMerchant(makeEvent({ 'x-commerce-key': 'cjsab12cd34_wrong' }))
    expect(resolution).toBeNull()
  })
})

describe('resolveMerchant — host paths', () => {
  it('returns null for platform hosts', async () => {
    const resolution = await resolveMerchant(makeEvent({ host: 'app.commercejs.cloud' }))
    expect(resolution).toBeNull()
  })

  it('resolves merchant subdomains under the base host', async () => {
    merchantFindUnique.mockResolvedValue(MERCHANT)
    merchantFindFirst.mockResolvedValue(MERCHANT)

    const resolution = await resolveMerchant(makeEvent({ host: 'test-store.commercejs.cloud:443' }))
    expect(resolution?.via).toBe('subdomain')
    expect(resolution?.merchant.subdomain).toBe('test-store')
  })

  it('ignores nested subdomains', async () => {
    merchantFindUnique.mockResolvedValue(MERCHANT)
    merchantFindFirst.mockResolvedValue(MERCHANT)
    const resolution = await resolveMerchant(makeEvent({ host: 'a.b.commercejs.cloud' }))
    expect(resolution).toBeNull()
  })

  it('returns null when nothing matches', async () => {
    const resolution = await resolveMerchant(makeEvent({ host: 'no-such.commercejs.cloud' }))
    expect(resolution).toBeNull()
  })
})

describe('merchant config cache', () => {
  it('caches by id and invalidates per merchant', async () => {
    merchantFindUnique.mockResolvedValue(MERCHANT)

    await getMerchantConfig('m-1')
    await getMerchantConfig('m-1')
    expect(merchantFindUnique).toHaveBeenCalledTimes(1)

    invalidateMerchantCache('m-1')
    await getMerchantConfig('m-1')
    expect(merchantFindUnique).toHaveBeenCalledTimes(2)
  })
})
