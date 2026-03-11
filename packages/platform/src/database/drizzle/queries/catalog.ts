// ---------------------------------------------------------------------------
// Drizzle: Catalog queries
// ---------------------------------------------------------------------------

import { eq, ilike, sql, and, or, asc, desc, gte, lte } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function findProductById(id: string) {
  const [row] = await getDb().select().from(schema.products).where(eq(schema.products.id, id))
  return row ?? null
}

export async function findProductBySlug(slug: string) {
  const [row] = await getDb().select().from(schema.products).where(eq(schema.products.slug, slug))
  return row ?? null
}

export async function findProducts(opts: {
  conditions: { field: string; op: 'eq' | 'like' | 'ilike' | 'search' | 'gte' | 'lte' | 'in'; value: any }[]
  orderBy?: { field: string; direction: 'asc' | 'desc' }
  limit: number
  offset: number
}) {
  const db = getDb()
  const conditions = opts.conditions.map(c => {
    const col = (schema.products as any)[c.field] ?? schema.products.createdAt
    switch (c.op) {
      case 'eq': return eq(col, c.value)
      case 'like': return ilike(col, c.value)
      case 'ilike': return ilike(col, c.value)
      case 'search': return or(ilike(schema.products.name, c.value), ilike(schema.products.description, c.value))!
      case 'gte': return sql`${col} >= ${c.value}`
      case 'lte': return sql`${col} <= ${c.value}`
      case 'in': return sql`${col} IN (${c.value})`
      default: return eq(col, c.value)
    }
  })

  const sortCol = opts.orderBy?.field === 'price' ? schema.products.price
    : opts.orderBy?.field === 'name' ? schema.products.name
    : schema.products.createdAt
  const orderFn = opts.orderBy?.direction === 'asc' ? asc : desc

  // Queries are serialized — Drizzle neon-http driver doesn't support
  // parallel queries on CF Workers.
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db.select().from(schema.products)
    .where(whereClause)
    .orderBy(orderFn(sortCol))
    .limit(opts.limit)
    .offset(opts.offset)

  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(schema.products)
    .where(whereClause)

  return { rows, total: countResult[0]?.count ?? 0 }
}

export async function findCategories(parentId?: string) {
  const db = getDb()
  if (parentId) {
    return db.select().from(schema.categories)
      .where(eq(schema.categories.parentId, parentId))
      .orderBy(asc(schema.categories.sortOrder))
  }
  return db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder))
}

export async function findProductImages(productId: string) {
  return getDb().select().from(schema.productImages)
    .where(eq(schema.productImages.productId, productId))
    .orderBy(asc(schema.productImages.sortOrder))
}

export async function findProductVariants(productId: string) {
  return getDb().select().from(schema.productVariants)
    .where(eq(schema.productVariants.productId, productId))
    .orderBy(asc(schema.productVariants.sortOrder))
}

export async function findProductAttributes(productId: string) {
  return getDb().select().from(schema.productAttributes)
    .where(eq(schema.productAttributes.productId, productId))
}

export async function findProductCategoryIds(productId: string): Promise<string[]> {
  const rows = await getDb().select({ categoryId: schema.productCategories.categoryId })
    .from(schema.productCategories)
    .where(eq(schema.productCategories.productId, productId))
  return rows.map(r => r.categoryId)
}

export async function findProductIdsByCategory(categoryId: string): Promise<string[]> {
  const rows = await getDb().select({ productId: schema.productCategories.productId })
    .from(schema.productCategories)
    .where(eq(schema.productCategories.categoryId, categoryId))
  return rows.map(r => r.productId)
}

export async function findProductTags(productId: string): Promise<string[]> {
  const rows = await getDb().select().from(schema.productTags)
    .where(eq(schema.productTags.productId, productId))
  return rows.map(r => r.tag)
}

export async function findCategoryById(id: string) {
  const [row] = await getDb().select().from(schema.categories).where(eq(schema.categories.id, id))
  return row ?? null
}
