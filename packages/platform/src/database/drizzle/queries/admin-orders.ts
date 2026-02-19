// ---------------------------------------------------------------------------
// Drizzle: Admin order queries
// ---------------------------------------------------------------------------

import { eq, sql, and, like, gte, lte, desc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function countOrders(): Promise<number> {
  const result = await getDb().select({ count: sql<number>`count(*)` }).from(schema.orders)
  return Number(result[0]?.count ?? 0)
}

export async function adminFindAllOrders(opts: {
  limit: number
  offset: number
  status?: string
  customerId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}) {
  const db = getDb()
  const conditions: any[] = []

  if (opts.status) conditions.push(eq(schema.orders.status, opts.status as any))
  if (opts.customerId) conditions.push(eq(schema.orders.customerId, opts.customerId))
  if (opts.dateFrom) conditions.push(gte(schema.orders.createdAt, new Date(opts.dateFrom)))
  if (opts.dateTo) conditions.push(lte(schema.orders.createdAt, new Date(opts.dateTo)))
  if (opts.search) conditions.push(like(schema.orders.orderNumber, `%${opts.search}%`))

  const [rows, countResult] = await Promise.all([
    db.select().from(schema.orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.orders.createdAt))
      .limit(opts.limit)
      .offset(opts.offset),
    db.select({ count: sql<number>`count(*)` })
      .from(schema.orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ])

  return { rows, total: countResult[0]?.count ?? 0 }
}

export async function updateOrderTracking(id: string, data: {
  trackingNumber?: string | null
  trackingUrl?: string | null
  status?: string
}) {
  await getDb().update(schema.orders).set({
    ...data as any,
    updatedAt: new Date(),
  }).where(eq(schema.orders.id, id))
}

export async function countOrdersByStatus() {
  const db = getDb()
  const result = await db
    .select({
      status: schema.orders.status,
      count: sql<number>`count(*)`,
    })
    .from(schema.orders)
    .groupBy(schema.orders.status)

  const map: Record<string, number> = {}
  for (const row of result) {
    map[row.status] = row.count
  }
  return map
}

export async function sumOrderRevenue() {
  const db = getDb()
  const [result] = await db
    .select({ total: sql<number>`COALESCE(SUM(total), 0)` })
    .from(schema.orders)
  return result?.total ?? 0
}

export async function findRecentOrders(limit: number) {
  return getDb().select().from(schema.orders)
    .orderBy(desc(schema.orders.createdAt))
    .limit(limit)
}
