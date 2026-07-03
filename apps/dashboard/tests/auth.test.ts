// ---------------------------------------------------------------------------
// Auth + API-key security units — the most sensitive new surface
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { authorizeDashboardSession } from '../server/utils/session'
import { generateApiKey, hashApiKey, extractKeyPrefix } from '../server/utils/apiKey'
import { resolveSessionPassword, sessionPasswordMisconfigured } from '../server/utils/sessionPassword'

const ADMIN = { userId: 'u1', email: 'a@x.dev', name: 'A', role: 'admin' as const }
const SUPPORT = { userId: 'u2', email: 's@x.dev', name: 'S', role: 'support' as const }

describe('authorizeDashboardSession', () => {
  it('401s an anonymous caller', () => {
    expect(() => authorizeDashboardSession(null)).toThrowError(/401|Authentication/)
  })

  it('allows any authenticated user when no roles are required', () => {
    expect(authorizeDashboardSession(SUPPORT)).toBe(SUPPORT)
  })

  it('403s a support user on an admin-only action', () => {
    expect(() => authorizeDashboardSession(SUPPORT, ['admin'])).toThrowError(/403|permission/i)
  })

  it('allows an admin on an admin-only action', () => {
    expect(authorizeDashboardSession(ADMIN, ['admin'])).toBe(ADMIN)
  })

  it('401 takes precedence over role checks', () => {
    let status: number | undefined
    try {
      authorizeDashboardSession(null, ['admin'])
    }
    catch (e: any) {
      status = e.statusCode
    }
    expect(status).toBe(401)
  })
})

describe('api key format — mint ↔ resolve round-trip', () => {
  it('generates <prefix>_<secret> with a hashable, prefix-splittable shape', () => {
    const { plaintext, keyPrefix, keyHash } = generateApiKey()
    expect(plaintext.startsWith(`${keyPrefix}_`)).toBe(true)
    expect(keyPrefix).not.toContain('_') // resolver splits on first "_"
    expect(extractKeyPrefix(plaintext)).toBe(keyPrefix)
    expect(hashApiKey(plaintext)).toBe(keyHash)
  })

  it('produces unique keys', () => {
    const a = generateApiKey()
    const b = generateApiKey()
    expect(a.plaintext).not.toBe(b.plaintext)
    expect(a.keyPrefix).not.toBe(b.keyPrefix)
  })

  it('hash is deterministic and diverges on tamper', () => {
    const { plaintext } = generateApiKey()
    expect(hashApiKey(plaintext)).toBe(hashApiKey(plaintext))
    expect(hashApiKey(plaintext)).not.toBe(hashApiKey(`${plaintext}x`))
  })

  it('extractKeyPrefix returns null for an empty token', () => {
    expect(extractKeyPrefix('_abc')).toBeNull()
    expect(extractKeyPrefix('')).toBeNull()
  })
})

describe('session-seal config guard', () => {
  it('flags a missing/short secret as misconfigured', () => {
    const prev = process.env.NUXT_SESSION_PASSWORD
    delete process.env.NUXT_SESSION_PASSWORD
    expect(sessionPasswordMisconfigured()).toBe(true)
    process.env.NUXT_SESSION_PASSWORD = 'short'
    expect(sessionPasswordMisconfigured()).toBe(true)
    process.env.NUXT_SESSION_PASSWORD = 'a'.repeat(32)
    expect(sessionPasswordMisconfigured()).toBe(false)
    if (prev === undefined) delete process.env.NUXT_SESSION_PASSWORD
    else process.env.NUXT_SESSION_PASSWORD = prev
  })

  it('resolves a valid secret through', () => {
    const prev = process.env.NUXT_SESSION_PASSWORD
    process.env.NUXT_SESSION_PASSWORD = 'x'.repeat(40)
    expect(resolveSessionPassword()).toBe('x'.repeat(40))
    if (prev === undefined) delete process.env.NUXT_SESSION_PASSWORD
    else process.env.NUXT_SESSION_PASSWORD = prev
  })
})
