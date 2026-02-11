// ---------------------------------------------------------------------------
// Drizzle: Order queries
// ---------------------------------------------------------------------------

import { eq, desc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function createOrder(data: Record<string, any>) {
  await getDb().insert(schema.orders).values(data as any)
}

export async function createOrderItem(data: Record<string, any>) {
  await getDb().insert(schema.orderItems).values(data as any)
}

export async function createOrderHistory(data: Record<string, any>) {
  await getDb().insert(schema.orderHistory).values(data as any)
}

export async function findOrderById(orderId: string) {
  const [row] = await getDb().select().from(schema.orders).where(eq(schema.orders.id, orderId))
  return row ?? null
}

export async function findOrders(opts: { limit: number; offset: number }) {
  return getDb().select().from(schema.orders)
    .orderBy(desc(schema.orders.createdAt))
    .limit(opts.limit)
    .offset(opts.offset)
}

export async function findOrderItems(orderId: string) {
  return getDb().select().from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, orderId))
}

export async function findOrderHistory(orderId: string) {
  return getDb().select().from(schema.orderHistory)
    .where(eq(schema.orderHistory.orderId, orderId))
    .orderBy(desc(schema.orderHistory.createdAt))
}

export async function updateOrder(orderId: string, data: Record<string, any>) {
  await getDb().update(schema.orders).set(data as any)
    .where(eq(schema.orders.id, orderId))
}
