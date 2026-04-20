// ---------------------------------------------------------------------------
// Drizzle: Admin analytics queries — revenue time series, top products,
// top customers. All exclude cancelled + refunded orders from revenue sums.
// ---------------------------------------------------------------------------

import { sql, and, gte, lte, notInArray, eq, asc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { parseFromBound, parseToBound } from '../../date-bounds.js'

export interface AnalyticsRangeOpts {
  from?: string
  to?: string
}

export interface RevenueSeriesRow {
  bucketStart: Date
  revenue: number
  orderCount: number
}

const EXCLUDED_STATUSES = ['cancelled', 'refunded']

export async function findRevenueTimeSeries(opts: {
  granularity: 'day' | 'week' | 'month'
  from: string
  to: string
}): Promise<RevenueSeriesRow[]> {
  const db = getDb()
  const from = parseFromBound(opts.from)
  const to = parseToBound(opts.to)
  // Granularity is validated by the caller — we select the literal here to avoid
  // smuggling user input into a raw SQL fragment.
  const granularitySql = opts.granularity === 'day'
    ? sql`'day'`
    : opts.granularity === 'week'
      ? sql`'week'`
      : sql`'month'`

  const bucketExpr = sql<Date>`date_trunc(${granularitySql}, ${schema.orders.createdAt} AT TIME ZONE 'UTC')`

  const rows = await db
    .select({
      bucket: bucketExpr,
      revenue: sql<string>`COALESCE(SUM(${schema.orders.total}), 0)`,
      orderCount: sql<number>`COUNT(*)`,
    })
    .from(schema.orders)
    .where(and(
      notInArray(schema.orders.status, EXCLUDED_STATUSES),
      gte(schema.orders.createdAt, from),
      lte(schema.orders.createdAt, to),
    ))
    .groupBy(bucketExpr)
    .orderBy(bucketExpr)

  return rows.map(r => ({
    bucketStart: r.bucket instanceof Date ? r.bucket : new Date(r.bucket as any),
    revenue: Number(r.revenue ?? 0),
    orderCount: Number(r.orderCount ?? 0),
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
  const db = getDb()
  const conditions: any[] = [notInArray(schema.orders.status, EXCLUDED_STATUSES)]
  if (opts.from) conditions.push(gte(schema.orders.createdAt, parseFromBound(opts.from)))
  if (opts.to) conditions.push(lte(schema.orders.createdAt, parseToBound(opts.to)))

  const rows = await db
    .select({
      productId: schema.products.id,
      name: schema.products.name,
      nameAr: schema.products.nameAr,
      sku: schema.products.sku,
      unitsSold: sql<number>`COALESCE(SUM(${schema.orderItems.quantity}), 0)`,
      revenue: sql<string>`COALESCE(SUM(${schema.orderItems.totalPrice}), 0)`,
    })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
    .innerJoin(schema.products, eq(schema.products.id, schema.orderItems.productId))
    .where(and(...conditions))
    .groupBy(schema.products.id, schema.products.name, schema.products.nameAr, schema.products.sku)
    .orderBy(sql`COALESCE(SUM(${schema.orderItems.totalPrice}), 0) DESC`, asc(schema.products.name))
    .limit(opts.limit)

  return rows.map(r => ({
    productId: r.productId,
    name: r.name,
    nameAr: r.nameAr,
    sku: r.sku,
    unitsSold: Number(r.unitsSold ?? 0),
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
  const db = getDb()
  const conditions: any[] = [notInArray(schema.orders.status, EXCLUDED_STATUSES)]
  if (opts.from) conditions.push(gte(schema.orders.createdAt, parseFromBound(opts.from)))
  if (opts.to) conditions.push(lte(schema.orders.createdAt, parseToBound(opts.to)))

  const rows = await db
    .select({
      customerId: schema.customers.id,
      email: schema.customers.email,
      orderCount: sql<number>`COUNT(${schema.orders.id})`,
      lifetimeValue: sql<string>`COALESCE(SUM(${schema.orders.total}), 0)`,
    })
    .from(schema.customers)
    .innerJoin(schema.orders, eq(schema.orders.customerId, schema.customers.id))
    .where(and(...conditions))
    .groupBy(schema.customers.id, schema.customers.email)
    .orderBy(sql`COALESCE(SUM(${schema.orders.total}), 0) DESC`, asc(schema.customers.email))
    .limit(opts.limit)

  return rows.map(r => ({
    customerId: r.customerId,
    email: r.email,
    orderCount: Number(r.orderCount ?? 0),
    lifetimeValue: Number(r.lifetimeValue ?? 0),
  }))
}
