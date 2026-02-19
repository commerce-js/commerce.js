// ---------------------------------------------------------------------------
// Drizzle: Admin store queries
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function adminUpdateStoreInfo(id: string, data: Record<string, any>) {
  await getDb().update(schema.storeInfo).set({
    ...data as any,
    updatedAt: new Date(),
  }).where(eq(schema.storeInfo.id, id))
}
