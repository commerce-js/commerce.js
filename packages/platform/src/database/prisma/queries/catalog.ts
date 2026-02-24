// ---------------------------------------------------------------------------
// Prisma: Catalog queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function findProductById(id: string) {
  return getDb().product.findUnique({ where: { id } })
}

export async function findProductBySlug(slug: string) {
  return getDb().product.findUnique({ where: { slug } })
}

export async function findProducts(opts: {
  conditions: { field: string; op: 'eq' | 'like' | 'ilike' | 'search' | 'gte' | 'lte' | 'in'; value: any }[]
  orderBy?: { field: string; direction: 'asc' | 'desc' }
  limit: number
  offset: number
}) {
  const prisma = getDb()
  const where: any = {}

  for (const c of opts.conditions) {
    const searchVal = c.value?.replace?.(/%/g, '') ?? c.value
    switch (c.op) {
      case 'eq':
        where[c.field] = c.value
        break
      case 'like':
      case 'ilike':
        where[c.field] = { contains: searchVal, mode: 'insensitive' }
        break
      case 'search':
        where.OR = [
          { name: { contains: searchVal, mode: 'insensitive' } },
          { description: { contains: searchVal, mode: 'insensitive' } },
        ]
        break
      case 'gte':
        where[c.field] = { ...where[c.field], gte: c.value }
        break
      case 'lte':
        where[c.field] = { ...where[c.field], lte: c.value }
        break
      case 'in':
        where[c.field] = { in: c.value }
        break
    }
  }

  const orderField = opts.orderBy?.field === 'price' ? 'price'
    : opts.orderBy?.field === 'name' ? 'name'
    : 'createdAt'

  const [rows, count] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [orderField]: opts.orderBy?.direction ?? 'desc' },
      take: opts.limit,
      skip: opts.offset,
    }),
    prisma.product.count({ where }),
  ])

  return { rows, total: count }
}

export async function findCategories(parentId?: string) {
  return getDb().category.findMany({
    where: parentId ? { parentId } : undefined,
    orderBy: { sortOrder: 'asc' },
  })
}

export async function findProductImages(productId: string) {
  return getDb().productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function findProductVariants(productId: string) {
  return getDb().productVariant.findMany({
    where: { productId },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function findProductAttributes(productId: string) {
  return getDb().productAttribute.findMany({
    where: { productId },
  })
}

export async function findProductCategoryIds(productId: string): Promise<string[]> {
  const rows = await getDb().productCategory.findMany({
    where: { productId },
    select: { categoryId: true },
  })
  return rows.map((r: any) => r.categoryId)
}

export async function findProductIdsByCategory(categoryId: string): Promise<string[]> {
  const rows = await getDb().productCategory.findMany({
    where: { categoryId },
    select: { productId: true },
  })
  return rows.map((r: any) => r.productId)
}

export async function findProductTags(productId: string): Promise<string[]> {
  const rows = await getDb().productTag.findMany({
    where: { productId },
    select: { tag: true },
  })
  return rows.map((r: any) => r.tag)
}

export async function findCategoryById(id: string) {
  return getDb().category.findUnique({ where: { id } })
}
