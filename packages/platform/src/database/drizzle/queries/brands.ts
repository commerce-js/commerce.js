// ---------------------------------------------------------------------------
// Drizzle: Brands queries
// ---------------------------------------------------------------------------

import { eq, asc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function findBrands() {
  return getDb().select().from(schema.brands)
    .where(eq(schema.brands.isActive, true))
    .orderBy(asc(schema.brands.name))
}

export async function findBrandById(id: string) {
  const [row] = await getDb().select().from(schema.brands).where(eq(schema.brands.id, id))
  return row ?? null
}

export async function insertBrand(data: Record<string, any>) {
  await getDb().insert(schema.brands).values(data as any)
}
