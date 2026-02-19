// ---------------------------------------------------------------------------
// Prisma: Returns queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findReturnsByOrder(orderId: string) {
  return getDb().return.findMany({ where: { orderId } })
}

export async function findReturnById(returnId: string) {
  return getDb().return.findFirst({ where: { id: returnId } })
}

export async function findReturnItemsByReturn(returnId: string) {
  return getDb().returnItem.findMany({ where: { returnId } })
}

export async function insertReturn(data: {
  orderId: string
  orderNumber: string
  customerNote?: string | null
}) {
  return getDb().return.create({
    data: {
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      status: 'requested',
      customerNote: data.customerNote ?? null,
    },
  })
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
  return getDb().returnItem.create({
    data: {
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
    },
  })
}

export async function updateReturnStatus(returnId: string, status: string) {
  return getDb().return.update({
    where: { id: returnId },
    data: { status },
  })
}
