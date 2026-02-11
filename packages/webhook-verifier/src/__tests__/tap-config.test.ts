import { describe, it, expect } from 'vitest'
import { tap } from '../configs/tap.js'

describe('Tap config preset', () => {
  it('uses "hashstring" as the signature header', () => {
    expect(tap.signatureHeader).toBe('hashstring')
  })

  it('uses sha256 hash algorithm', () => {
    expect(tap.hashAlgorithm).toBe('sha256')
  })

  it('uses hex encoding', () => {
    expect(tap.encoding).toBe('hex')
  })

  it('includes the Tap payload formatter', () => {
    expect(tap.payloadFormatter).toBeTypeOf('function')
  })

  it('does not include secretKey (must be provided by user)', () => {
    expect(tap).not.toHaveProperty('secretKey')
  })
})
