// ---------------------------------------------------------------------------
// Drizzle: Countries queries
// ---------------------------------------------------------------------------

import { eq, asc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function findCountries() {
  return getDb().select().from(schema.countries)
    .where(eq(schema.countries.isActive, true))
    .orderBy(asc(schema.countries.name))
}

export async function findCountryById(id: string) {
  const [row] = await getDb().select().from(schema.countries).where(eq(schema.countries.id, id))
  return row ?? null
}

export async function insertCountry(data: Record<string, any>) {
  await getDb().insert(schema.countries).values(data as any)
}
