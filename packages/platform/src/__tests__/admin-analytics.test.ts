// ---------------------------------------------------------------------------
// admin analytics domain — unit tests for zero-fill, top-N, AOV, refund rate
// ---------------------------------------------------------------------------
//
// Mocks the query layer so we don't stand up Prisma or Drizzle. Verifies:
//   - getRevenueTimeSeries zero-fills missing buckets
//   - getTopProducts / getTopCustomers respect limit
//   - getDashboardStats computes AOV and refundRate correctly
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  findRevenueTimeSeries: vi.fn(),
  findTopProductsByRevenue: vi.fn(),
  findTopCustomersBySpend: vi.fn(),
  countProducts: vi.fn(),
  countActiveProducts: vi.fn(),
  countOrders: vi.fn(),
  sumOrderRevenue: vi.fn(),
  countCustomers: vi.fn(),
  countOrdersByStatus: vi.fn(),
  findRecentOrders: vi.fn(),
  findOrderItems: vi.fn(),
}))

vi.mock('../database/index.js', () => mocks)

import { createAdminAnalyticsDomain, zeroFillBuckets } from '../admin/analytics.js'
import { createAdminAPI } from '../admin/index.js'

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset()
})

const domain = createAdminAnalyticsDomain()

describe('zeroFillBuckets', () => {
  it('zero-fills missing days across a 7-day range', () => {
    const from = new Date('2026-04-01T00:00:00Z')
    const to = new Date('2026-04-07T23:59:59Z')
    const rows = [
      { bucketStart: new Date('2026-04-02T00:00:00Z'), revenue: 100, orderCount: 2 },
      { bucketStart: new Date('2026-04-05T00:00:00Z'), revenue: 50, orderCount: 1 },
    ]
    const filled = zeroFillBuckets(rows, 'day', from, to)
    expect(filled).toHaveLength(7)
    expect(filled[0]).toEqual({ bucket: '2026-04-01T00:00:00.000Z', revenue: 0, orderCount: 0 })
    expect(filled[1]).toEqual({ bucket: '2026-04-02T00:00:00.000Z', revenue: 100, orderCount: 2 })
    expect(filled[4]).toEqual({ bucket: '2026-04-05T00:00:00.000Z', revenue: 50, orderCount: 1 })
    expect(filled[6]).toEqual({ bucket: '2026-04-07T00:00:00.000Z', revenue: 0, orderCount: 0 })
  })

  it('handles empty result sets', () => {
    const filled = zeroFillBuckets(
      [],
      'day',
      new Date('2026-04-10T00:00:00Z'),
      new Date('2026-04-12T23:59:59Z'),
    )
    expect(filled).toHaveLength(3)
    expect(filled.every(b => b.revenue === 0 && b.orderCount === 0)).toBe(true)
  })

  it('bucketizes by month correctly', () => {
    const filled = zeroFillBuckets(
      [{ bucketStart: new Date('2026-02-01T00:00:00Z'), revenue: 200, orderCount: 3 }],
      'month',
      new Date('2026-01-15T00:00:00Z'),
      new Date('2026-04-05T23:59:59Z'),
    )
    expect(filled).toHaveLength(4)
    expect(filled[0].bucket).toBe('2026-01-01T00:00:00.000Z')
    expect(filled[1].bucket).toBe('2026-02-01T00:00:00.000Z')
    expect(filled[1].revenue).toBe(200)
    expect(filled[2].revenue).toBe(0)
  })
})

describe('getRevenueTimeSeries', () => {
  it('returns zero-filled buckets for the full range', async () => {
    mocks.findRevenueTimeSeries.mockResolvedValueOnce([
      { bucketStart: new Date('2026-04-02T00:00:00Z'), revenue: 100, orderCount: 2 },
    ])
    const result = await domain.getRevenueTimeSeries({
      granularity: 'day',
      from: '2026-04-01',
      to: '2026-04-03',
    })
    expect(result).toHaveLength(3)
    expect(result[1].revenue).toBe(100)
    expect(result[0].revenue).toBe(0)
    expect(result[2].revenue).toBe(0)
  })

  it('rejects invalid granularity', async () => {
    await expect(
      domain.getRevenueTimeSeries({ granularity: 'hour' as any, from: '2026-04-01', to: '2026-04-02' }),
    ).rejects.toThrow(/Invalid granularity/)
  })

  it('returns [] when to < from', async () => {
    const result = await domain.getRevenueTimeSeries({
      granularity: 'day',
      from: '2026-04-10',
      to: '2026-04-01',
    })
    expect(result).toEqual([])
    expect(mocks.findRevenueTimeSeries).not.toHaveBeenCalled()
  })
})

describe('getTopProducts', () => {
  it('respects limit and maps LocalizedString', async () => {
    mocks.findTopProductsByRevenue.mockResolvedValueOnce([
      { productId: 'p1', name: 'Shirt', nameAr: 'قميص', sku: 'S1', unitsSold: 10, revenue: 500 },
      { productId: 'p2', name: 'Hat', nameAr: null, sku: null, unitsSold: 5, revenue: 100 },
    ])
    const result = await domain.getTopProducts({ limit: 2 })
    expect(mocks.findTopProductsByRevenue).toHaveBeenCalledWith(expect.objectContaining({ limit: 2 }))
    expect(result).toHaveLength(2)
    expect(result[0].name).toEqual({ en: 'Shirt', ar: 'قميص' })
    expect(result[1].name).toEqual({ en: 'Hat', ar: '' })
    expect(result[0].revenue).toBe(500)
  })

  it('defaults limit to 10 when unset', async () => {
    mocks.findTopProductsByRevenue.mockResolvedValueOnce([])
    await domain.getTopProducts()
    expect(mocks.findTopProductsByRevenue).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }))
  })

  it('clamps excessive limit', async () => {
    mocks.findTopProductsByRevenue.mockResolvedValueOnce([])
    await domain.getTopProducts({ limit: 9999 })
    expect(mocks.findTopProductsByRevenue).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }))
  })
})

describe('getTopCustomers', () => {
  it('returns rows in the order the query provided (descending LTV)', async () => {
    mocks.findTopCustomersBySpend.mockResolvedValueOnce([
      { customerId: 'c1', email: 'big@x.com', orderCount: 8, lifetimeValue: 2000 },
      { customerId: 'c2', email: 'mid@x.com', orderCount: 3, lifetimeValue: 400 },
    ])
    const result = await domain.getTopCustomers({ limit: 5 })
    expect(mocks.findTopCustomersBySpend).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }))
    expect(result[0].lifetimeValue).toBe(2000)
    expect(result[1].lifetimeValue).toBe(400)
  })
})

describe('getDashboardStats — AOV and refundRate', () => {
  function wireDashboardMocks(opts: {
    totalOrders: number
    totalRevenue: number
    ordersByStatus: Record<string, number>
  }) {
    mocks.countProducts.mockResolvedValue(0)
    mocks.countActiveProducts.mockResolvedValue(0)
    mocks.countOrders.mockResolvedValue(opts.totalOrders)
    mocks.sumOrderRevenue.mockResolvedValue(opts.totalRevenue)
    mocks.countCustomers.mockResolvedValue(0)
    mocks.countOrdersByStatus.mockResolvedValue(opts.ordersByStatus)
    mocks.findRecentOrders.mockResolvedValue([])
    mocks.findOrderItems.mockResolvedValue([])
  }

  it('computes AOV as revenue / non-cancelled-non-refunded count', async () => {
    wireDashboardMocks({
      totalOrders: 10,
      totalRevenue: 800, // revenue only counts non-cancelled non-refunded
      ordersByStatus: { pending: 2, shipped: 6, cancelled: 1, refunded: 1 },
    })
    const api = createAdminAPI('SAR')
    const stats = await api.getDashboardStats()
    // completed = 10 - 1 (cancelled) - 1 (refunded) = 8
    expect(stats.avgOrderValue).toBe(100)
  })

  it('AOV is 0 when no qualifying orders exist', async () => {
    wireDashboardMocks({
      totalOrders: 2,
      totalRevenue: 0,
      ordersByStatus: { cancelled: 1, refunded: 1 },
    })
    const api = createAdminAPI('SAR')
    const stats = await api.getDashboardStats()
    expect(stats.avgOrderValue).toBe(0)
  })

  it('refundRate ∈ [0, 1] and excludes cancelled from denominator', async () => {
    wireDashboardMocks({
      totalOrders: 10,
      totalRevenue: 900,
      ordersByStatus: { pending: 2, shipped: 5, cancelled: 2, refunded: 1 },
    })
    const api = createAdminAPI('SAR')
    const stats = await api.getDashboardStats()
    // refundRate = 1 / (10 - 2) = 0.125
    expect(stats.refundRate).toBeCloseTo(0.125)
    expect(stats.refundRate).toBeGreaterThanOrEqual(0)
    expect(stats.refundRate).toBeLessThanOrEqual(1)
  })

  it('refundRate is 0 when every order was cancelled', async () => {
    wireDashboardMocks({
      totalOrders: 3,
      totalRevenue: 0,
      ordersByStatus: { cancelled: 3 },
    })
    const api = createAdminAPI('SAR')
    const stats = await api.getDashboardStats()
    expect(stats.refundRate).toBe(0)
  })
})
