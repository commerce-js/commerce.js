// ---------------------------------------------------------------------------
// Drizzle: Admin catalog queries (products + categories write ops)
// ---------------------------------------------------------------------------

import { eq, sql, and, like, asc, desc, lte } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

// ---- Products ----

export async function countProducts(): Promise<number> {
  const result = await getDb().select({ count: sql<number>`count(*)` }).from(schema.products)
  return Number(result[0]?.count ?? 0)
}

export async function countActiveProducts(): Promise<number> {
  const result = await getDb().select({ count: sql<number>`count(*)` }).from(schema.products)
    .where(eq(schema.products.status, 'active'))
  return Number(result[0]?.count ?? 0)
}

export async function adminCreateProduct(data: Record<string, any>) {
  await getDb().insert(schema.products).values(data as any)
}

export async function adminUpdateProduct(id: string, data: Record<string, any>) {
  await getDb().update(schema.products).set(data as any)
    .where(eq(schema.products.id, id))
}

export async function adminDeleteProduct(id: string) {
  await getDb().delete(schema.products)
    .where(eq(schema.products.id, id))
}

export async function adminListProducts(opts: {
  limit: number
  offset: number
  search?: string
  sort?: { field: string; direction: 'asc' | 'desc' }
  orderBy?: { field: string; direction: 'asc' | 'desc' }
}) {
  const db = getDb()
  const conditions: any[] = []

  if (opts.search) {
    conditions.push(like(schema.products.name, `%${opts.search}%`))
  }

  const sorting = opts.orderBy || opts.sort
  const sortCol = sorting?.field === 'price' ? schema.products.price
    : sorting?.field === 'name' ? schema.products.name
    : schema.products.createdAt
  const orderFn = sorting?.direction === 'asc' ? asc : desc

  const [rows, countResult] = await Promise.all([
    db.select().from(schema.products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(sortCol))
      .limit(opts.limit)
      .offset(opts.offset),
    db.select({ count: sql<number>`count(*)` })
      .from(schema.products)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ])

  return { rows, total: countResult[0]?.count ?? 0 }
}

// ---- Product relations ----

export async function adminCreateProductImage(data: Record<string, any>) {
  await getDb().insert(schema.productImages).values(data as any)
}

export async function adminDeleteProductImages(productId: string) {
  await getDb().delete(schema.productImages)
    .where(eq(schema.productImages.productId, productId))
}

export async function adminCreateProductVariant(data: Record<string, any>) {
  await getDb().insert(schema.productVariants).values(data as any)
}

export async function adminDeleteProductVariants(productId: string) {
  await getDb().delete(schema.productVariants)
    .where(eq(schema.productVariants.productId, productId))
}

export async function adminCreateProductAttribute(data: Record<string, any>) {
  await getDb().insert(schema.productAttributes).values(data as any)
}

export async function adminDeleteProductAttributes(productId: string) {
  await getDb().delete(schema.productAttributes)
    .where(eq(schema.productAttributes.productId, productId))
}

export async function adminCreateProductTag(data: Record<string, any>) {
  await getDb().insert(schema.productTags).values(data as any)
}

export async function adminDeleteProductTags(productId: string) {
  await getDb().delete(schema.productTags)
    .where(eq(schema.productTags.productId, productId))
}

export async function adminCreateProductCategory(data: { productId: string; categoryId: string }) {
  await getDb().insert(schema.productCategories).values(data as any)
}

export async function adminDeleteProductCategories(productId: string) {
  await getDb().delete(schema.productCategories)
    .where(eq(schema.productCategories.productId, productId))
}

// ---- Categories ----

export async function adminCreateCategory(data: Record<string, any>) {
  await getDb().insert(schema.categories).values(data as any)
}

export async function adminUpdateCategory(id: string, data: Record<string, any>) {
  await getDb().update(schema.categories).set(data as any)
    .where(eq(schema.categories.id, id))
}

export async function adminDeleteCategory(id: string) {
  await getDb().delete(schema.categories)
    .where(eq(schema.categories.id, id))
}

export async function adminFindChildCategories(parentId: string) {
  return getDb().select().from(schema.categories)
    .where(eq(schema.categories.parentId, parentId))
}

// ---- Inventory helpers ----

export async function adminFindLowStockProducts(threshold: number, limit: number) {
  return getDb().select().from(schema.products)
    .where(and(
      lte(schema.products.inventoryQuantity, threshold),
      eq(schema.products.status, 'active'),
    ))
    .orderBy(asc(schema.products.inventoryQuantity))
    .limit(limit)
}

// ---- Variant update ----

export async function updateProductVariantById(id: string, data: Record<string, unknown>) {
  await getDb().update(schema.productVariants).set(data as any)
    .where(eq(schema.productVariants.id, id))
}

// ---- Set product categories (delete + replace) ----

export async function setProductCategories(productId: string, categoryIds: string[]) {
  await getDb().delete(schema.productCategories)
    .where(eq(schema.productCategories.productId, productId))
  for (const categoryId of categoryIds) {
    await getDb().insert(schema.productCategories).values({ productId, categoryId })
  }
}
