import { describe, expect, it } from 'vitest'
import {
  DEV_SESSION_FALLBACK,
  MIN_SESSION_PASSWORD_LENGTH,
  isSecureSecret,
  pickSessionPassword,
} from '../sessionSeal'

// Guards the fail-closed session-seal policy. The bug this replaces: a missing
// or short NUXT_SESSION_PASSWORD silently fell back to a hardcoded key in
// PRODUCTION, making operator/merchant/buyer cookies forgeable.

const strong = 'x'.repeat(MIN_SESSION_PASSWORD_LENGTH) // exactly 32 chars

describe('isSecureSecret', () => {
  it('accepts a secret of >= 32 chars', () => {
    expect(isSecureSecret(strong)).toBe(true)
    expect(isSecureSecret('y'.repeat(64))).toBe(true)
  })

  it('rejects short, empty, null, and undefined secrets', () => {
    expect(isSecureSecret('x'.repeat(31))).toBe(false)
    expect(isSecureSecret('short')).toBe(false)
    expect(isSecureSecret('')).toBe(false)
    expect(isSecureSecret(undefined)).toBe(false)
    expect(isSecureSecret(null)).toBe(false)
  })
})

describe('pickSessionPassword', () => {
  it('uses a strong secret in both dev and production', () => {
    expect(pickSessionPassword(strong, false)).toBe(strong)
    expect(pickSessionPassword(strong, true)).toBe(strong)
  })

  it('falls back to the dev key ONLY in development when the secret is weak', () => {
    expect(pickSessionPassword(undefined, true)).toBe(DEV_SESSION_FALLBACK)
    expect(pickSessionPassword('short', true)).toBe(DEV_SESSION_FALLBACK)
  })

  it('THROWS in production when the secret is missing or too short (fail-closed)', () => {
    expect(() => pickSessionPassword(undefined, false)).toThrow(/NUXT_SESSION_PASSWORD/)
    expect(() => pickSessionPassword('', false)).toThrow(/32 characters/)
    expect(() => pickSessionPassword('x'.repeat(31), false)).toThrow()
  })

  it('never returns the public dev key in production', () => {
    // In prod there are exactly two outcomes: a strong secret, or a throw.
    expect(() => pickSessionPassword('weak', false)).toThrow()
    expect(pickSessionPassword(strong, false)).not.toBe(DEV_SESSION_FALLBACK)
  })
})

it('the dev fallback is itself long enough for h3 (>= 32 chars)', () => {
  expect(DEV_SESSION_FALLBACK.length).toBeGreaterThanOrEqual(MIN_SESSION_PASSWORD_LENGTH)
})
