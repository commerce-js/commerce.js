// ---------------------------------------------------------------------------
// Drizzle: Returns queries
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function findReturnsByOrder(orderId: string) {
  return getDb().select().from(schema.returns)
    .where(eq(schema.returns.orderId, orderId))
}

export async function findReturnById(returnId: string) {
  const [row] = await getDb().select().from(schema.returns)
    .where(eq(schema.returns.id, returnId))
  return row ?? null
}

export async function findReturnItemsByReturn(returnId: string) {
  return getDb().select().from(schema.returnItems)
    .where(eq(schema.returnItems.returnId, returnId))
}

export async function insertReturn(data: {
  orderId: string
  orderNumber: string
  customerNote?: string | null
}) {
  const id = crypto.randomUUID()
  await getDb().insert(schema.returns).values({
    id,
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    status: 'requested',
    customerNote: data.customerNote ?? null,
  })
  return id
}

export async function insertReturnItem(data: {
  returnId: string
  orderItemId: string
  productId: string
  variantId?: string | null
  name: string
  nameAr?: string | null
  image?: string | null
  quantity: number
  reason: string
  reasonNote?: string | null
}) {
  const id = crypto.randomUUID()
  getDb().insert(schema.returnItems).values({
    id,
    returnId: data.returnId,
    orderItemId: data.orderItemId,
    productId: data.productId,
    variantId: data.variantId ?? null,
    name: data.name,
    nameAr: data.nameAr ?? null,
    image: data.image ?? null,
    quantity: data.quantity,
    reason: data.reason,
    reasonNote: data.reasonNote ?? null,
  })
  return id
}

export async function updateReturnStatus(returnId: string, status: string) {
  await getDb().update(schema.returns)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.returns.id, returnId))
}
