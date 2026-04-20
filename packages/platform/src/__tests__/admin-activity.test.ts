// ---------------------------------------------------------------------------
// admin activity domain — unit tests for recordActivity + listActivity
// ---------------------------------------------------------------------------
//
// Mocks the query layer so we don't stand up Prisma or Drizzle. Verifies:
//   - recordActivity forwards input to insertActivityEvent
//   - listActivity maps + paginates + filters correctly
//   - filters (actorId, entityType, from, to) are forwarded
//   - perPage clamping (DEFAULT=50, MAX=200)
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  insertActivityEvent: vi.fn(),
  findActivityEvents: vi.fn(),
}))

vi.mock('../database/index.js', () => mocks)

import { createAdminActivityDomain } from '../admin/activity.js'

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset()
})

const domain = createAdminActivityDomain()

describe('recordActivity', () => {
  it('forwards input with defaults for optional fields', async () => {
    mocks.insertActivityEvent.mockResolvedValueOnce({ id: 'evt_1' })
    await domain.recordActivity({
      actorId: 'u1',
      actorEmail: 'owner@example.com',
      action: 'order.fulfilled',
      entityType: 'order',
      entityId: 'ord_1',
      diff: { status: { before: 'pending', after: 'shipped' } },
    })
    expect(mocks.insertActivityEvent).toHaveBeenCalledWith({
      actorId: 'u1',
      actorEmail: 'owner@example.com',
      action: 'order.fulfilled',
      entityType: 'order',
      entityId: 'ord_1',
      diff: { status: { before: 'pending', after: 'shipped' } },
    })
  })

  it('accepts null actorId (system actions) and null entityId + diff', async () => {
    mocks.insertActivityEvent.mockResolvedValueOnce({})
    await domain.recordActivity({
      actorId: null,
      actorEmail: 'system',
      action: 'settings.updated',
      entityType: 'settings',
    })
    expect(mocks.insertActivityEvent).toHaveBeenCalledWith({
      actorId: null,
      actorEmail: 'system',
      action: 'settings.updated',
      entityType: 'settings',
      entityId: null,
      diff: null,
    })
  })
})

describe('listActivity', () => {
  function mockRows(count: number, total = count) {
    mocks.findActivityEvents.mockResolvedValueOnce({
      rows: Array.from({ length: count }, (_, i) => ({
        id: `evt_${i}`,
        actorId: 'u1',
        actorEmail: 'owner@example.com',
        action: 'product.updated',
        entityType: 'product',
        entityId: `p_${i}`,
        diff: { price: { before: 100, after: 120 } },
        createdAt: new Date('2026-04-20T10:00:00Z'),
      })),
      total,
    })
  }

  it('maps rows and paginates with defaults (perPage=50, page=1)', async () => {
    mockRows(2, 2)
    const result = await domain.listActivity()
    expect(mocks.findActivityEvents).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, offset: 0 }),
    )
    expect(result.items).toHaveLength(2)
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(50)
    expect(result.total).toBe(2)
    expect(result.hasMore).toBe(false)
    expect(result.items[0].createdAt).toBe('2026-04-20T10:00:00.000Z')
  })

  it('computes hasMore when total exceeds current page', async () => {
    mockRows(10, 42)
    const result = await domain.listActivity({ page: 1, perPage: 10 })
    expect(result.hasMore).toBe(true)
    expect(result.total).toBe(42)
  })

  it('forwards actorId + entityType + from + to filters', async () => {
    mockRows(0, 0)
    await domain.listActivity({
      actorId: 'u1',
      entityType: 'order',
      from: '2026-04-01',
      to: '2026-04-20',
    })
    expect(mocks.findActivityEvents).toHaveBeenCalledWith({
      limit: 50,
      offset: 0,
      actorId: 'u1',
      entityType: 'order',
      from: '2026-04-01',
      to: '2026-04-20',
    })
  })

  it('clamps perPage to MAX (200)', async () => {
    mockRows(0, 0)
    await domain.listActivity({ perPage: 9999 })
    expect(mocks.findActivityEvents).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 200 }),
    )
  })

  it('normalizes perPage<1 to 1 and page<1 to 1', async () => {
    mockRows(0, 0)
    await domain.listActivity({ perPage: 0, page: 0 })
    expect(mocks.findActivityEvents).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 1, offset: 0 }),
    )
  })

  it('applies offset = (page-1)*perPage', async () => {
    mockRows(0, 0)
    await domain.listActivity({ page: 3, perPage: 20 })
    expect(mocks.findActivityEvents).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 40 }),
    )
  })

  it('preserves snapshotted actorEmail after actor is deleted (null actorId path)', async () => {
    mocks.findActivityEvents.mockResolvedValueOnce({
      rows: [{
        id: 'evt_1',
        actorId: null, // admin was deleted
        actorEmail: 'ex-staff@example.com',
        action: 'product.created',
        entityType: 'product',
        entityId: 'p1',
        diff: null,
        createdAt: new Date('2026-04-01T09:00:00Z'),
      }],
      total: 1,
    })
    const result = await domain.listActivity()
    expect(result.items[0].actorId).toBeNull()
    expect(result.items[0].actorEmail).toBe('ex-staff@example.com')
  })
})
