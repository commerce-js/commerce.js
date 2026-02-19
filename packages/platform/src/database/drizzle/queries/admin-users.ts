// ---------------------------------------------------------------------------
// Drizzle: Admin user queries
// ---------------------------------------------------------------------------

import { eq, sql, asc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function findAdminByEmail(email: string) {
  const [row] = await getDb().select().from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email))
  return row ?? null
}

export async function findAdminById(id: string) {
  const [row] = await getDb().select().from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, id))
  return row ?? null
}

export async function createAdminUser(data: {
  id: string
  email: string
  passwordHash: string
  name?: string
  role?: string
  createdAt?: string | Date
  updatedAt?: string | Date
}) {
  await getDb().insert(schema.adminUsers).values(data as any)
}

export async function updateAdminUser(id: string, data: Record<string, any>) {
  await getDb().update(schema.adminUsers).set(data as any)
    .where(eq(schema.adminUsers.id, id))
}

export async function deleteAdminUser(id: string) {
  await getDb().delete(schema.adminUsers)
    .where(eq(schema.adminUsers.id, id))
}

export async function findAllAdminUsers() {
  return getDb().select().from(schema.adminUsers)
    .orderBy(asc(schema.adminUsers.createdAt))
}

export async function countAdminUsers() {
  const [result] = await getDb()
    .select({ count: sql<number>`count(*)` })
    .from(schema.adminUsers)
  return result?.count ?? 0
}
