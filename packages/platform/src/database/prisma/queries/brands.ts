// ---------------------------------------------------------------------------
// Prisma: Brands queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findBrands() {
  return getDb().brand.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

export async function findBrandById(id: string) {
  return getDb().brand.findUnique({ where: { id } })
}

export async function insertBrand(data: Record<string, any>) {
  await getDb().brand.create({ data: data as any })
}
