// ---------------------------------------------------------------------------
// Prisma: Order queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

/** Serialize any object values to JSON strings for Prisma's String columns */
function serializeObjects(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && typeof value === 'object' && !(value instanceof Date)) {
      out[key] = JSON.stringify(value)
    } else {
      out[key] = value
    }
  }
  return out
}

export async function createOrder(data: Record<string, any>) {
  await getDb().order.create({ data: serializeObjects(data) as any })
}

export async function createOrderItem(data: Record<string, any>) {
  await getDb().orderItem.create({ data: data as any })
}

export async function createOrderHistory(data: Record<string, any>) {
  await getDb().orderHistory.create({ data: data as any })
}

export async function findOrderById(orderId: string) {
  return getDb().order.findUnique({ where: { id: orderId } })
}

export async function findOrders(opts: { limit: number; offset: number }) {
  return getDb().order.findMany({
    orderBy: { createdAt: 'desc' },
    take: opts.limit,
    skip: opts.offset,
  })
}

export async function findOrderItems(orderId: string) {
  return getDb().orderItem.findMany({ where: { orderId } })
}

export async function findOrderHistory(orderId: string) {
  return getDb().orderHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateOrder(orderId: string, data: Record<string, any>) {
  await getDb().order.update({ where: { id: orderId }, data: serializeObjects(data) })
}
