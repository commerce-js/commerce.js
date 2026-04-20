// ---------------------------------------------------------------------------
// Prisma: Admin user queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findAdminByEmail(email: string) {
  return getDb().adminUser.findUnique({ where: { email } })
}

export async function findAdminById(id: string) {
  return getDb().adminUser.findUnique({ where: { id } })
}

export async function createAdminUser(data: {
  id: string
  email: string
  /** `null` is accepted for the 'invited' status path — the row is created
   * with no password_hash and flipped to 'active' + hash on invite accept. */
  passwordHash: string | null
  name?: string
  role?: string
  status?: string
}) {
  return getDb().adminUser.create({ data: data as any })
}

export async function updateAdminUser(id: string, data: Record<string, any>) {
  return getDb().adminUser.update({ where: { id }, data })
}

export async function deleteAdminUser(id: string) {
  return getDb().adminUser.delete({ where: { id } })
}

export async function findAllAdminUsers() {
  return getDb().adminUser.findMany({ orderBy: { createdAt: 'asc' } })
}

export async function countAdminUsers() {
  return getDb().adminUser.count()
}
