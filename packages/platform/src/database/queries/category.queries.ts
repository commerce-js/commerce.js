// ---------------------------------------------------------------------------
// Category queries
// ---------------------------------------------------------------------------

import type { PrismaDatabase } from '../prisma/client.js'

export function findCategories(db: PrismaDatabase) {
  return db.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: { children: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })
}

export function findCategoryBySlug(db: PrismaDatabase, slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: {
      children: { orderBy: { sortOrder: 'asc' } },
      products: { include: { product: true }, take: 20 },
    },
  })
}

export function findCategoryById(db: PrismaDatabase, id: string) {
  return db.category.findUnique({
    where: { id },
    include: { children: true },
  })
}

export function createCategory(
  db: PrismaDatabase,
  data: {
    name: string
    nameAr?: string
    slug: string
    description?: string
    descriptionAr?: string
    image?: string
    parentId?: string
    sortOrder?: number
  },
) {
  return db.category.create({ data })
}

export function updateCategory(
  db: PrismaDatabase,
  id: string,
  data: Partial<{
    name: string
    nameAr: string
    slug: string
    description: string
    image: string
    parentId: string
    sortOrder: number
  }>,
) {
  return db.category.update({ where: { id }, data })
}

export function deleteCategory(db: PrismaDatabase, id: string) {
  return db.category.delete({ where: { id } })
}

export function upsertCategory(
  db: PrismaDatabase,
  data: {
    externalId: string
    name: string
    nameAr?: string
    slug: string
    description?: string
    image?: string
    parentId?: string
    sortOrder?: number
  },
) {
  const { externalId: _externalId, ...rest } = data

  return db.category.upsert({
    where: { slug: data.slug },
    create: rest,
    update: rest,
  })
}
