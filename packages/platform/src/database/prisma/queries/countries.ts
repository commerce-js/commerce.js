// ---------------------------------------------------------------------------
// Prisma: Countries queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findCountries() {
  return getDb().country.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

export async function findCountryById(id: string) {
  return getDb().country.findUnique({ where: { id } })
}

export async function insertCountry(data: Record<string, any>) {
  await getDb().country.create({ data: data as any })
}
