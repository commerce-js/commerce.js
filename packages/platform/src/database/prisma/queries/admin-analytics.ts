// ---------------------------------------------------------------------------
// Prisma: Admin analytics queries — revenue time series, top products,
// top customers. All exclude cancelled + refunded orders from revenue sums.
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'
import { Prisma } from './../generated/client.js'
import { parseFromBound, parseToBound } from '../../date-bounds.js'

export interface AnalyticsRangeOpts {
  from?: string
  to?: string
}

/** Row shape returned by the raw time-series query. */
export interface RevenueSeriesRow {
  bucketStart: Date
  revenue: number
  orderCount: number
}

const GRANULARITY_SQL: Record<'day' | 'week' | 'month', Prisma.Sql> = {
  day: Prisma.sql`'day'`,
  week: Prisma.sql`'week'`,
  month: Prisma.sql`'month'`,
}

export async function findRevenueTimeSeries(opts: {
  granularity: 'day' | 'week' | 'month'
  from: string
  to: string
}): Promise<RevenueSeriesRow[]> {
  const prisma = getDb()
  const from = parseFromBound(opts.from)
  const to = parseToBound(opts.to)
  const gran = GRANULARITY_SQL[opts.granularity]

  type SeriesQueryRow = { bucket: Date; revenue: any; order_count: bigint | number }
  const rows = await prisma.$queryRaw<SeriesQueryRow[]>(Prisma.sql`
    SELECT
      date_trunc(${gran}, created_at AT TIME ZONE 'UTC') AS bucket,
      COALESCE(SUM(total), 0) AS revenue,
      COUNT(*) AS order_count
    FROM orders
    WHERE status NOT IN ('cancelled', 'refunded')
      AND created_at >= ${from}
      AND created_at <= ${to}
    GROUP BY bucket
    ORDER BY bucket ASC
  `) as SeriesQueryRow[]

  return rows.map((r: SeriesQueryRow) => ({
    bucketStart: r.bucket instanceof Date ? r.bucket : new Date(r.bucket),
    revenue: Number(r.revenue ?? 0),
    orderCount: Number(r.order_count ?? 0),
  }))
}

export interface TopProductRow {
  productId: string
  name: string
  nameAr: string | null
  sku: string | null
  unitsSold: number
  revenue: number
}

export async function findTopProductsByRevenue(opts: AnalyticsRangeOpts & { limit: number }): Promise<TopProductRow[]> {
  const prisma = getDb()
  const from = opts.from ? parseFromBound(opts.from) : null
  const to = opts.to ? parseToBound(opts.to) : null

  const fromClause = from ? Prisma.sql`AND o.created_at >= ${from}` : Prisma.empty
  const toClause = to ? Prisma.sql`AND o.created_at <= ${to}` : Prisma.empty

  type ProductQueryRow = {
    product_id: string
    name: string
    name_ar: string | null
    sku: string | null
    units_sold: bigint | number
    revenue: any
  }
  // NOTE: ::text casts on both sides of the product_id join — some merchant
  // Neon branches have products.id as uuid and order_items.product_id as
  // text (schema drift from early provisioning), which crashes the raw query
  // with `operator does not exist: uuid = text`. Casting both sides makes
  // the join resilient to either shape.
  const rows = await prisma.$queryRaw<ProductQueryRow[]>(Prisma.sql`
    SELECT
      p.id AS product_id,
      p.name,
      p.name_ar,
      p.sku,
      COALESCE(SUM(oi.quantity), 0) AS units_sold,
      COALESCE(SUM(oi.total_price), 0) AS revenue
    FROM order_items oi
    INNER JOIN orders o ON o.id::text = oi.order_id::text
    INNER JOIN products p ON p.id::text = oi.product_id::text
    WHERE o.status NOT IN ('cancelled', 'refunded')
      ${fromClause}
      ${toClause}
    GROUP BY p.id, p.name, p.name_ar, p.sku
    ORDER BY revenue DESC, p.name ASC
    LIMIT ${opts.limit}
  `) as ProductQueryRow[]

  return rows.map((r: ProductQueryRow) => ({
    productId: r.product_id,
    name: r.name,
    nameAr: r.name_ar,
    sku: r.sku,
    unitsSold: Number(r.units_sold ?? 0),
    revenue: Number(r.revenue ?? 0),
  }))
}

export interface TopCustomerRow {
  customerId: string
  email: string
  orderCount: number
  lifetimeValue: number
}

export async function findTopCustomersBySpend(opts: AnalyticsRangeOpts & { limit: number }): Promise<TopCustomerRow[]> {
  const prisma = getDb()
  const from = opts.from ? parseFromBound(opts.from) : null
  const to = opts.to ? parseToBound(opts.to) : null

  const fromClause = from ? Prisma.sql`AND o.created_at >= ${from}` : Prisma.empty
  const toClause = to ? Prisma.sql`AND o.created_at <= ${to}` : Prisma.empty

  type CustomerQueryRow = {
    customer_id: string
    email: string
    order_count: bigint | number
    lifetime_value: any
  }
  const rows = await prisma.$queryRaw<CustomerQueryRow[]>(Prisma.sql`
    SELECT
      c.id AS customer_id,
      c.email,
      COUNT(o.id) AS order_count,
      COALESCE(SUM(o.total), 0) AS lifetime_value
    FROM customers c
    INNER JOIN orders o ON o.customer_id::text = c.id::text
    WHERE o.status NOT IN ('cancelled', 'refunded')
      ${fromClause}
      ${toClause}
    GROUP BY c.id, c.email
    ORDER BY lifetime_value DESC, c.email ASC
    LIMIT ${opts.limit}
  `) as CustomerQueryRow[]

  return rows.map((r: CustomerQueryRow) => ({
    customerId: r.customer_id,
    email: r.email,
    orderCount: Number(r.order_count ?? 0),
    lifetimeValue: Number(r.lifetime_value ?? 0),
  }))
}
