// ---------------------------------------------------------------------------
// Drizzle: Admin customer queries
// ---------------------------------------------------------------------------

import { eq, sql, like, or, desc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function adminFindAllCustomers(opts: {
  limit: number
  offset: number
  search?: string
}) {
  const db = getDb()

  const condition = opts.search
    ? or(
        like(schema.customers.email, `%${opts.search}%`),
        like(schema.customers.firstName, `%${opts.search}%`),
        like(schema.customers.lastName, `%${opts.search}%`),
      )
    : undefined

  const [rows, countResult] = await Promise.all([
    db.select().from(schema.customers)
      .where(condition)
      .orderBy(desc(schema.customers.createdAt))
      .limit(opts.limit)
      .offset(opts.offset),
    db.select({ count: sql<number>`count(*)` })
      .from(schema.customers)
      .where(condition),
  ])

  return { rows, total: countResult[0]?.count ?? 0 }
}

export async function adminDeleteCustomer(id: string) {
  await getDb().delete(schema.customers)
    .where(eq(schema.customers.id, id))
}

export async function countCustomers() {
  const db = getDb()
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.customers)
  return result?.count ?? 0
}
