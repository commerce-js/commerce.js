import { describe, expect, it } from 'vitest'
import { apiKeyLookupPrefix, generateApiKey, hashApiKey } from '../apiKey'

describe('hashApiKey', () => {
  it('is deterministic sha256 hex', () => {
    expect(hashApiKey('abc_def')).toBe(hashApiKey('abc_def'))
    expect(hashApiKey('abc_def')).toMatch(/^[0-9a-f]{64}$/)
    expect(hashApiKey('abc_def')).not.toBe(hashApiKey('abc_deg'))
  })
})

describe('apiKeyLookupPrefix', () => {
  it('returns the segment before the first underscore', () => {
    expect(apiKeyLookupPrefix('cjs123_secretpart')).toBe('cjs123')
    expect(apiKeyLookupPrefix('cjs123_sec_ret')).toBe('cjs123') // only the FIRST split
  })

  it('returns null when there is no prefix', () => {
    expect(apiKeyLookupPrefix('')).toBeNull()
    expect(apiKeyLookupPrefix('_orphan')).toBeNull()
  })
})

describe('generateApiKey', () => {
  it('produces a consistent, verifiable key', () => {
    const k = generateApiKey()
    // fullKey is `<keyPrefix>_<secret>` with a non-empty hex secret
    expect(k.fullKey.startsWith(`${k.keyPrefix}_`)).toBe(true)
    const secret = k.fullKey.slice(k.keyPrefix.length + 1)
    expect(secret).toMatch(/^[0-9a-f]+$/)
    // prefix is branded, underscore-free, and is what the resolver looks up
    expect(k.keyPrefix).toMatch(/^cjs[0-9a-f]+$/)
    expect(k.keyPrefix).not.toContain('_')
    expect(apiKeyLookupPrefix(k.fullKey)).toBe(k.keyPrefix)
    // stored hash matches a fresh hash of the full key (what the resolver does)
    expect(k.keyHash).toBe(hashApiKey(k.fullKey))
  })

  it('mints a distinct key each call', () => {
    const a = generateApiKey()
    const b = generateApiKey()
    expect(a.fullKey).not.toBe(b.fullKey)
    expect(a.keyPrefix).not.toBe(b.keyPrefix)
    expect(a.keyHash).not.toBe(b.keyHash)
  })
})
