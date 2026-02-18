// ---------------------------------------------------------------------------
// Prisma: Admin customer queries — list all customers, delete, count
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findAllCustomers(opts: {
  search?: string
  limit: number
  offset: number
}) {
  const prisma = getDb()
  const where: any = {}

  if (opts.search) {
    where.OR = [
      { email: { contains: opts.search } },
      { firstName: { contains: opts.search } },
      { lastName: { contains: opts.search } },
    ]
  }

  const [rows, count] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts.limit,
      skip: opts.offset,
    }),
    prisma.customer.count({ where }),
  ])

  return { rows, total: count }
}

export async function deleteCustomerById(id: string) {
  return getDb().customer.delete({ where: { id } })
}

export async function countCustomers(): Promise<number> {
  return getDb().customer.count()
}
