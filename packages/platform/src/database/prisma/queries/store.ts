// ---------------------------------------------------------------------------
// Prisma: Store queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findStoreInfo(id: string) {
  // With native Json type, Prisma returns objects directly — no parsing needed
  return getDb().storeInfo.findUnique({ where: { id } })
}

export async function createStoreInfo(data: Record<string, any>) {
  // With native Json type, Prisma handles arrays/objects directly — no serialization needed
  await getDb().storeInfo.create({ data: data as any })
}
