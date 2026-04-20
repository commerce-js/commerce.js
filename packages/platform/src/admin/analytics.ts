// ---------------------------------------------------------------------------
// Admin: Analytics — revenue time series, top products, top customers
// ---------------------------------------------------------------------------
//
// Exposes the four analytics read methods used by the merchant /admin/analytics
// page. Revenue/time-series numbers exclude cancelled + refunded orders so the
// totals match finance-facing AOV/revenue reporting. Time-series buckets are
// zero-filled in the domain layer so charts render without gaps even when
// several days in the range saw no orders.
// ---------------------------------------------------------------------------

import {
  findRevenueTimeSeries,
  findTopProductsByRevenue,
  findTopCustomersBySpend,
} from '../database/index.js'
import { localized } from '../domains/helpers.js'
import { parseFromBound, parseToBound } from '../database/date-bounds.js'
import type {
  RevenueTimeSeriesParams,
  RevenueBucket,
  TopProductsParams,
  TopProduct,
  TopCustomersParams,
  TopCustomer,
  AnalyticsGranularity,
} from './types.js'

const DEFAULT_TOP_N = 10
const MAX_TOP_N = 100

function clampLimit(limit: number | undefined): number {
  if (!limit || limit <= 0) return DEFAULT_TOP_N
  return Math.min(limit, MAX_TOP_N)
}

/**
 * Zero-fill missing buckets between `from` and `to` so the caller renders a
 * contiguous chart. Input rows are assumed sorted ASC by bucketStart.
 */
export function zeroFillBuckets(
  rows: Array<{ bucketStart: Date; revenue: number; orderCount: number }>,
  granularity: AnalyticsGranularity,
  from: Date,
  to: Date,
): RevenueBucket[] {
  const present = new Map<string, { revenue: number; orderCount: number }>()
  for (const r of rows) {
    present.set(truncateBucket(r.bucketStart, granularity).toISOString(), {
      revenue: r.revenue,
      orderCount: r.orderCount,
    })
  }

  const out: RevenueBucket[] = []
  let cursor = truncateBucket(from, granularity)
  const end = truncateBucket(to, granularity)

  // Safety cap — prevents a runaway loop on malformed input. 3 years of daily
  // buckets is the practical ceiling for the merchant UI.
  let guard = 0
  while (cursor <= end && guard < 2000) {
    const key = cursor.toISOString()
    const hit = present.get(key)
    out.push({
      bucket: key,
      revenue: hit?.revenue ?? 0,
      orderCount: hit?.orderCount ?? 0,
    })
    cursor = advanceBucket(cursor, granularity)
    guard += 1
  }
  return out
}

function truncateBucket(d: Date, granularity: AnalyticsGranularity): Date {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  if (granularity === 'day') return utc
  if (granularity === 'month') return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  // week — ISO week, Monday-start, matches Postgres date_trunc('week', …)
  const dow = utc.getUTCDay() // 0 = Sun, 1 = Mon, …
  const deltaToMon = (dow + 6) % 7
  utc.setUTCDate(utc.getUTCDate() - deltaToMon)
  return utc
}

function advanceBucket(d: Date, granularity: AnalyticsGranularity): Date {
  const next = new Date(d.getTime())
  if (granularity === 'day') next.setUTCDate(next.getUTCDate() + 1)
  else if (granularity === 'week') next.setUTCDate(next.getUTCDate() + 7)
  else next.setUTCMonth(next.getUTCMonth() + 1)
  return next
}

export function createAdminAnalyticsDomain() {
  return {
    async getRevenueTimeSeries(params: RevenueTimeSeriesParams): Promise<RevenueBucket[]> {
      if (!['day', 'week', 'month'].includes(params.granularity)) {
        throw new Error(`Invalid granularity: ${params.granularity}`)
      }
      const from = parseFromBound(params.from)
      const to = parseToBound(params.to)
      if (to < from) return []

      const rows = await findRevenueTimeSeries({
        granularity: params.granularity,
        from: params.from,
        to: params.to,
      })

      return zeroFillBuckets(rows, params.granularity, from, to)
    },

    async getTopProducts(params?: TopProductsParams): Promise<TopProduct[]> {
      const limit = clampLimit(params?.limit)
      const rows = await findTopProductsByRevenue({
        limit,
        from: params?.from,
        to: params?.to,
      })
      return rows.map(r => ({
        productId: r.productId,
        name: localized(r.name, r.nameAr),
        sku: r.sku,
        unitsSold: r.unitsSold,
        revenue: r.revenue,
      }))
    },

    async getTopCustomers(params?: TopCustomersParams): Promise<TopCustomer[]> {
      const limit = clampLimit(params?.limit)
      const rows = await findTopCustomersBySpend({
        limit,
        from: params?.from,
        to: params?.to,
      })
      return rows.map(r => ({
        customerId: r.customerId,
        email: r.email,
        orderCount: r.orderCount,
        lifetimeValue: r.lifetimeValue,
      }))
    },
  }
}
