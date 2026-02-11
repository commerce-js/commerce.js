// ---------------------------------------------------------------------------
// Drizzle: Store queries
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function findStoreInfo(id: string) {
  const [row] = await getDb().select().from(schema.storeInfo).where(eq(schema.storeInfo.id, id))
  return row ?? null
}

export async function createStoreInfo(data: Record<string, any>) {
  await getDb().insert(schema.storeInfo).values(data as any)
}
