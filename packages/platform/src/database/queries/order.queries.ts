// ---------------------------------------------------------------------------
// Order queries
// ---------------------------------------------------------------------------

import type { PrismaDatabase } from '../prisma/client.js'

const orderInclude = {
  items: true,
  history: { orderBy: { createdAt: 'asc' as const } },
  customer: { select: { id: true, email: true, firstName: true, lastName: true } },
} as const

export interface CreateOrderData {
  customerId?: string
  subtotal: number
  shippingCost?: number
  tax?: number
  discount?: number
  total: number
  currency?: string
  shippingAddress?: object
  billingAddress?: object
  shippingMethod?: string
  paymentMethod?: string
  note?: string
  requiresShipping?: boolean
  items: Array<{
    productId: string
    variantId?: string
    name: string
    nameAr?: string
    image?: string
    quantity: number
    price: number
    totalPrice: number
    productType?: string
  }>
}

export async function createOrder(db: PrismaDatabase, data: CreateOrderData) {
  const { items, ...orderData } = data

  // Generate order number: ORD-{timestamp}-{random 4 digits}
  const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

  return db.order.create({
    data: {
      ...orderData,
      orderNumber,
      items: { create: items },
    },
    include: orderInclude,
  })
}

export function findOrder(db: PrismaDatabase, id: string) {
  return db.order.findUnique({
    where: { id },
    include: orderInclude,
  })
}

export function findOrderByNumber(db: PrismaDatabase, orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: orderInclude,
  })
}

export function findCustomerOrders(
  db: PrismaDatabase,
  customerId: string,
  opts: { limit?: number; offset?: number } = {},
) {
  return db.order.findMany({
    where: { customerId },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
    take: opts.limit ?? 20,
    skip: opts.offset ?? 0,
  })
}

export function findOrders(
  db: PrismaDatabase,
  opts: {
    limit?: number
    offset?: number
    status?: string
    search?: string
  } = {},
) {
  const { limit = 20, offset = 0, status, search } = opts

  return db.order.findMany({
    where: {
      ...(status && { status }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customer: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

export async function updateOrderStatus(
  db: PrismaDatabase,
  id: string,
  toStatus: string,
  opts: { fromStatus?: string; note?: string } = {},
) {
  const [order] = await db.$transaction([
    db.order.update({
      where: { id },
      data: { status: toStatus },
      include: orderInclude,
    }),
    db.orderHistory.create({
      data: {
        orderId: id,
        fromStatus: opts.fromStatus,
        toStatus,
        note: opts.note,
      },
    }),
  ])
  return order
}

export function updateOrderTracking(
  db: PrismaDatabase,
  id: string,
  trackingNumber: string,
  trackingUrl?: string,
) {
  return db.order.update({
    where: { id },
    data: { trackingNumber, ...(trackingUrl && { trackingUrl }) },
  })
}

export function updateOrderItemFulfillment(
  db: PrismaDatabase,
  orderItemId: string,
  fulfillmentStatus: string,
) {
  return db.orderItem.update({
    where: { id: orderItemId },
    data: { fulfillmentStatus },
  })
}

export function upsertOrder(db: PrismaDatabase, data: CreateOrderData & { externalId: string }) {
  const { externalId, items, ...orderData } = data

  return db.order.upsert({
    where: { orderNumber: externalId },
    create: {
      ...orderData,
      orderNumber: externalId,
      items: { create: items },
    },
    update: orderData,
    include: orderInclude,
  })
}
