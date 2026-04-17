// ---------------------------------------------------------------------------
// admin.fulfillOrder / admin.refundOrder status-guard unit test
// ---------------------------------------------------------------------------
//
// Tests the guard branch in isolation — mocks the DB layer so we don't
// stand up Prisma or Drizzle. Verifies:
//   - fulfillOrder refuses shipped/delivered/refunded/cancelled/returned
//   - refundOrder refuses pending/refunded/cancelled/returned
//   - Both still accept the valid starting states and perform the write.
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  findOrderById: vi.fn(),
  findOrderItems: vi.fn(),
  findAllOrders: vi.fn(),
  updateOrderTracking: vi.fn(),
  updateOrder: vi.fn(),
  createOrderHistory: vi.fn(),
}))

vi.mock('../database/index.js', () => mocks)

import { createAdminOrdersDomain } from '../admin/orders.js'

beforeEach(() => {
  mocks.findOrderById.mockReset()
  mocks.updateOrderTracking.mockReset()
  mocks.updateOrder.mockReset()
  mocks.createOrderHistory.mockReset()
})

const domain = createAdminOrdersDomain('SAR')

describe('admin.fulfillOrder status guard', () => {
  for (const s of ['shipped', 'delivered', 'refunded', 'cancelled', 'returned']) {
    it(`rejects order in status '${s}'`, async () => {
      mocks.findOrderById.mockResolvedValueOnce({ id: 'o1', status: s })
      await expect(domain.fulfillOrder('o1', {})).rejects.toThrow(/Cannot fulfill/)
      expect(mocks.updateOrderTracking).not.toHaveBeenCalled()
      expect(mocks.createOrderHistory).not.toHaveBeenCalled()
    })
  }

  for (const s of ['pending', 'processing']) {
    it(`accepts order in status '${s}'`, async () => {
      mocks.findOrderById.mockResolvedValueOnce({ id: 'o1', status: s })
      await expect(domain.fulfillOrder('o1', { trackingNumber: 'T1' })).resolves.toBeUndefined()
      expect(mocks.updateOrderTracking).toHaveBeenCalledWith('o1', {
        trackingNumber: 'T1',
        trackingUrl: null,
        status: 'shipped',
      })
      expect(mocks.createOrderHistory).toHaveBeenCalledWith(expect.objectContaining({
        orderId: 'o1',
        fromStatus: s,
        toStatus: 'shipped',
      }))
    })
  }
})

describe('admin.refundOrder status guard', () => {
  for (const s of ['pending', 'refunded', 'cancelled', 'returned']) {
    it(`rejects order in status '${s}'`, async () => {
      mocks.findOrderById.mockResolvedValueOnce({ id: 'o1', status: s })
      await expect(domain.refundOrder('o1', 'note')).rejects.toThrow(/Cannot refund/)
      expect(mocks.updateOrder).not.toHaveBeenCalled()
      expect(mocks.createOrderHistory).not.toHaveBeenCalled()
    })
  }

  for (const s of ['processing', 'shipped', 'delivered']) {
    it(`accepts order in status '${s}'`, async () => {
      mocks.findOrderById.mockResolvedValueOnce({ id: 'o1', status: s })
      await expect(domain.refundOrder('o1', 'note')).resolves.toBeUndefined()
      expect(mocks.updateOrder).toHaveBeenCalledWith('o1', { status: 'refunded' })
      expect(mocks.createOrderHistory).toHaveBeenCalledWith(expect.objectContaining({
        orderId: 'o1',
        fromStatus: s,
        toStatus: 'refunded',
      }))
    })
  }
})

describe('admin.fulfillOrder / refundOrder — not-found', () => {
  it('fulfillOrder throws "not found" when order missing', async () => {
    mocks.findOrderById.mockResolvedValueOnce(null)
    await expect(domain.fulfillOrder('nope', {})).rejects.toThrow(/not found/i)
  })
  it('refundOrder throws "not found" when order missing', async () => {
    mocks.findOrderById.mockResolvedValueOnce(null)
    await expect(domain.refundOrder('nope')).rejects.toThrow(/not found/i)
  })
})
