// ---------------------------------------------------------------------------
// date-bounds unit test
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { parseFromBound, parseToBound } from '../database/date-bounds.js'

describe('parseFromBound', () => {
  it('expands a date-only string to start-of-day UTC', () => {
    expect(parseFromBound('2026-04-16').toISOString()).toBe('2026-04-16T00:00:00.000Z')
  })

  it('respects an explicit ISO-8601 timestamp', () => {
    expect(parseFromBound('2026-04-16T10:30:00Z').toISOString()).toBe('2026-04-16T10:30:00.000Z')
  })
})

describe('parseToBound', () => {
  it('expands a date-only string to end-of-day UTC (inclusive filter)', () => {
    expect(parseToBound('2026-04-17').toISOString()).toBe('2026-04-17T23:59:59.999Z')
  })

  it('respects an explicit ISO-8601 timestamp', () => {
    expect(parseToBound('2026-04-17T10:30:00Z').toISOString()).toBe('2026-04-17T10:30:00.000Z')
  })
})
