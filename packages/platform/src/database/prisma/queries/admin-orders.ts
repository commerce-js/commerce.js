// ---------------------------------------------------------------------------
// Prisma: Admin order queries — list all orders, fulfillment, stats
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function countOrders(): Promise<number> {
  return getDb().order.count()
}

export async function findAllOrders(opts: {
  status?: string
  customerId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  limit: number
  offset: number
}) {
  const prisma = getDb()
  const where: any = {}

  if (opts.status) where.status = opts.status
  if (opts.customerId) where.customerId = opts.customerId
  if (opts.search) {
    where.OR = [
      { orderNumber: { contains: opts.search } },
    ]
  }
  if (opts.dateFrom || opts.dateTo) {
    where.createdAt = {}
    if (opts.dateFrom) where.createdAt.gte = opts.dateFrom
    if (opts.dateTo) where.createdAt.lte = opts.dateTo
  }

  const [rows, count] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts.limit,
      skip: opts.offset,
    }),
    prisma.order.count({ where }),
  ])

  return { rows, total: count }
}

export async function updateOrderTracking(id: string, data: {
  trackingNumber?: string | null
  trackingUrl?: string | null
  status?: string
}) {
  return getDb().order.update({ where: { id }, data })
}

export async function countOrdersByStatus() {
  const prisma = getDb()
  const orders = await prisma.order.findMany({
    select: { status: true },
  })

  const counts: Record<string, number> = {}
  for (const order of orders) {
    counts[order.status] = (counts[order.status] ?? 0) + 1
  }
  return counts
}

export async function sumOrderRevenue(): Promise<number> {
  const prisma = getDb()
  const result = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: { notIn: ['cancelled', 'refunded'] } },
  })
  const total = result._sum.total
  return total ? (typeof total === 'number' ? total : Number(total)) : 0
}

export async function findRecentOrders(limit: number = 10) {
  return getDb().order.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
