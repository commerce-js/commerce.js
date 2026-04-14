// ---------------------------------------------------------------------------
// Product queries — all product-related DB operations
// Requires: pnpm --filter @commercejs/platform run prisma:generate
// ---------------------------------------------------------------------------

import type { PrismaDatabase } from '../prisma/client.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FindProductsOptions {
  limit?: number
  offset?: number
  status?: string
  categorySlug?: string
  search?: string
  currency?: string
}

export interface UpsertProductData {
  externalId: string
  sku?: string
  name: string
  nameAr?: string
  slug: string
  description?: string
  descriptionAr?: string
  shortDescription?: string
  shortDescriptionAr?: string
  price?: number
  compareAtPrice?: number
  currency?: string
  inStock?: boolean
  inventoryQuantity?: number
  status?: string
  images?: Array<{ url: string; altText?: string; isPrimary?: boolean; sortOrder?: number }>
}

// ---------------------------------------------------------------------------
// Read queries
// ---------------------------------------------------------------------------

export function findProducts(db: PrismaDatabase, opts: FindProductsOptions = {}) {
  const { limit = 20, offset = 0, status = 'active', categorySlug, search } = opts

  return db.product.findMany({
    where: {
      status,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { nameAr: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categorySlug && {
        categories: {
          some: { category: { slug: categorySlug } },
        },
      }),
    },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { sortOrder: 'asc' } },
      options: {
        orderBy: { sortOrder: 'asc' },
        include: { values: { orderBy: { sortOrder: 'asc' } } },
      },
      categories: { include: { category: true } },
      tags: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

export function countProducts(db: PrismaDatabase, opts: Pick<FindProductsOptions, 'status' | 'categorySlug' | 'search'> = {}) {
  const { status = 'active', categorySlug, search } = opts

  return db.product.count({
    where: {
      status,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { nameAr: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categorySlug && {
        categories: { some: { category: { slug: categorySlug } } },
      }),
    },
  })
}

export function findProductBySlug(db: PrismaDatabase, slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { sortOrder: 'asc' } },
      options: {
        orderBy: { sortOrder: 'asc' },
        include: { values: { orderBy: { sortOrder: 'asc' } } },
      },
      attributes: true,
      categories: { include: { category: true } },
      tags: true,
    },
  })
}

export function findProductById(db: PrismaDatabase, id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { sortOrder: 'asc' } },
      options: {
        orderBy: { sortOrder: 'asc' },
        include: { values: { orderBy: { sortOrder: 'asc' } } },
      },
      attributes: true,
      categories: { include: { category: true } },
      tags: true,
    },
  })
}

// ---------------------------------------------------------------------------
// Write queries
// ---------------------------------------------------------------------------

export function createProduct(
  db: PrismaDatabase,
  data: {
    name: string
    nameAr?: string
    slug: string
    description?: string
    descriptionAr?: string
    price?: number
    currency?: string
    status?: string
    images?: Array<{ url: string; altText?: string; isPrimary?: boolean; sortOrder?: number }>
  },
) {
  const { images, ...productData } = data

  return db.product.create({
    data: {
      ...productData,
      ...(images?.length && {
        images: { create: images },
      }),
    },
    include: { images: true, variants: true },
  })
}

export function updateProduct(
  db: PrismaDatabase,
  id: string,
  data: Partial<{
    name: string
    nameAr: string
    slug: string
    description: string
    descriptionAr: string
    price: number
    compareAtPrice: number
    inStock: boolean
    inventoryQuantity: number
    status: string
  }>,
) {
  return db.product.update({
    where: { id },
    data,
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

export function deleteProduct(db: PrismaDatabase, id: string) {
  return db.product.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// Sync (upsert) — used by import adapters (Salla, Medusa, etc.)
// Skips on duplicate externalId — safe to re-run.
// ---------------------------------------------------------------------------

export async function upsertProduct(db: PrismaDatabase, data: UpsertProductData) {
  const { externalId, images, price, compareAtPrice, ...rest } = data

  return db.product.upsert({
    where: { slug: data.slug },
    create: {
      ...rest,
      ...(price != null && { price }),
      ...(compareAtPrice != null && { compareAtPrice }),
      attributes: {
        create: [{ code: 'externalId', name: 'External ID', value: externalId }],
      },
      ...(images?.length && {
        images: { create: images },
      }),
    },
    update: {
      ...rest,
      ...(price != null && { price }),
      ...(compareAtPrice != null && { compareAtPrice }),
    },
  })
}
