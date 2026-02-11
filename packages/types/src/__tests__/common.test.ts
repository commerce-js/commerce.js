import { describe, it, expect } from 'vitest'
import { CommerceError, isCommerceError } from '../common.js'

describe('CommerceError', () => {
  it('extends Error', () => {
    const err = new CommerceError('fail', 'UNKNOWN')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(CommerceError)
  })

  it('sets message, code, statusCode, and cause', () => {
    const cause = new Error('root cause')
    const err = new CommerceError('not found', 'NOT_FOUND', 404, cause)

    expect(err.message).toBe('not found')
    expect(err.code).toBe('NOT_FOUND')
    expect(err.statusCode).toBe(404)
    expect(err.cause).toBe(cause)
  })

  it('has name "CommerceError"', () => {
    const err = new CommerceError('x', 'UNKNOWN')
    expect(err.name).toBe('CommerceError')
  })

  it('works without optional fields', () => {
    const err = new CommerceError('oops', 'VALIDATION')
    expect(err.statusCode).toBeUndefined()
    expect(err.cause).toBeUndefined()
  })
})

describe('isCommerceError', () => {
  it('returns true for CommerceError instances', () => {
    const err = new CommerceError('test', 'UNKNOWN')
    expect(isCommerceError(err)).toBe(true)
  })

  it('returns false for plain Error', () => {
    expect(isCommerceError(new Error('plain'))).toBe(false)
  })

  it('returns false for non-error values', () => {
    expect(isCommerceError('string')).toBe(false)
    expect(isCommerceError(null)).toBe(false)
    expect(isCommerceError(undefined)).toBe(false)
    expect(isCommerceError(42)).toBe(false)
    expect(isCommerceError({ code: 'UNKNOWN' })).toBe(false)
  })
})
