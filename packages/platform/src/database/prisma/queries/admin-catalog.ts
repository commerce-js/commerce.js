// ---------------------------------------------------------------------------
// Prisma: Admin catalog queries — product & category CRUD
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

// ---- Products ----

export async function insertProduct(data: {
  id: string
  name: string
  nameAr?: string | null
  slug: string
  description?: string | null
  descriptionAr?: string | null
  shortDescription?: string | null
  shortDescriptionAr?: string | null
  price?: number | null
  compareAtPrice?: number | null
  currency?: string
  sku?: string | null
  productType?: string
  status?: string
  inStock?: boolean
  inventoryQuantity?: number | null
  quantityLimit?: number | null
  vatIncluded?: boolean
  vatRate?: number | null
  requiresShipping?: boolean
  isDropshipped?: boolean
}) {
  return getDb().product.create({ data })
}

export async function updateProductById(id: string, data: Record<string, unknown>) {
  return getDb().product.update({ where: { id }, data })
}

export async function deleteProductById(id: string) {
  return getDb().product.delete({ where: { id } })
}

export async function findAllProducts(opts: {
  search?: string
  sort?: { field: string; direction: 'asc' | 'desc' }
  limit: number
  offset: number
}) {
  const prisma = getDb()
  const where: any = {}

  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search } },
      { sku: { contains: opts.search } },
    ]
  }

  const orderField = opts.sort?.field === 'price' ? 'price'
    : opts.sort?.field === 'name' ? 'name'
    : opts.sort?.field === 'status' ? 'status'
    : 'createdAt'

  const [rows, count] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [orderField]: opts.sort?.direction ?? 'desc' },
      take: opts.limit,
      skip: opts.offset,
    }),
    prisma.product.count({ where }),
  ])

  return { rows, total: count }
}

// ---- Product images ----

export async function insertProductImage(data: {
  id: string
  productId: string
  url: string
  altText?: string | null
  sortOrder?: number
  isPrimary?: boolean
}) {
  return getDb().productImage.create({ data })
}

export async function deleteProductImages(productId: string) {
  return getDb().productImage.deleteMany({ where: { productId } })
}

// ---- Product variants ----

export async function insertProductVariant(data: {
  id: string
  productId: string
  sku?: string | null
  name?: string | null
  nameAr?: string | null
  price?: number | null
  compareAtPrice?: number | null
  inStock?: boolean
  inventoryQuantity?: number | null
  sortOrder?: number
}) {
  return getDb().productVariant.create({ data })
}

export async function deleteProductVariants(productId: string) {
  return getDb().productVariant.deleteMany({ where: { productId } })
}

export async function updateProductVariantById(id: string, data: Record<string, unknown>) {
  return getDb().productVariant.update({ where: { id }, data })
}

// ---- Product attributes ----

export async function insertProductAttribute(data: {
  id: string
  productId: string
  code: string
  name: string
  nameAr?: string | null
  value: string
  valueAr?: string | null
}) {
  return getDb().productAttribute.create({ data })
}

export async function deleteProductAttributes(productId: string) {
  return getDb().productAttribute.deleteMany({ where: { productId } })
}

// ---- Product tags ----

export async function insertProductTag(data: {
  id: string
  productId: string
  tag: string
}) {
  return getDb().productTag.create({ data })
}

export async function deleteProductTags(productId: string) {
  return getDb().productTag.deleteMany({ where: { productId } })
}

// ---- Product categories ----

export async function setProductCategories(productId: string, categoryIds: string[]) {
  const prisma = getDb()
  // Clear existing
  await prisma.productCategory.deleteMany({ where: { productId } })
  // Insert new
  if (categoryIds.length > 0) {
    await prisma.productCategory.createMany({
      data: categoryIds.map(categoryId => ({ productId, categoryId })),
    })
  }
}

// ---- Categories ----

export async function insertCategory(data: {
  id: string
  name: string
  nameAr?: string | null
  slug: string
  description?: string | null
  descriptionAr?: string | null
  image?: string | null
  parentId?: string | null
  sortOrder?: number
}) {
  return getDb().category.create({ data })
}

export async function updateCategoryById(id: string, data: Record<string, unknown>) {
  return getDb().category.update({ where: { id }, data })
}

export async function deleteCategoryById(id: string) {
  return getDb().category.delete({ where: { id } })
}

export async function findCategoryChildren(parentId: string) {
  return getDb().category.findMany({ where: { parentId } })
}

// ---- Dashboard stats ----

export async function countProducts(): Promise<number> {
  return getDb().product.count()
}

export async function countActiveProducts(): Promise<number> {
  return getDb().product.count({ where: { status: 'active' } })
}

// ---- Inventory helpers ----

export async function adminFindLowStockProducts(threshold: number, limit: number) {
  return getDb().product.findMany({
    where: {
      inventoryQuantity: { lte: threshold },
      status: 'active',
    },
    orderBy: { inventoryQuantity: 'asc' },
    take: limit,
  })
}

// ---- Product categories (junction) ----

export async function adminCreateProductCategory(data: { productId: string; categoryId: string }) {
  return getDb().productCategory.create({ data })
}

export async function adminDeleteProductCategories(productId: string) {
  return getDb().productCategory.deleteMany({ where: { productId } })
}
