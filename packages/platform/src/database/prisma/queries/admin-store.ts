// ---------------------------------------------------------------------------
// Prisma: Admin store queries — update store settings
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function updateStoreInfo(id: string, data: Record<string, unknown>) {
  return getDb().storeInfo.update({ where: { id }, data })
}
