// ---------------------------------------------------------------------------
// Admin: Category CRUD
// ---------------------------------------------------------------------------

import type { Category } from '@commercejs/types'
import type { CreateCategoryInput, UpdateCategoryInput } from './types.js'
import {
  findCategoryById,
  insertCategory,
  updateCategoryById,
  deleteCategoryById,
  findCategoryChildren,
  findCategories,
} from '../database/index.js'
import { localized, img } from '../domains/helpers.js'

/** Generate a URL-safe slug from a category name */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0621-\u064A]+/g, '-')
    .replace(/^-|-$/g, '')
    || crypto.randomUUID().slice(0, 8)
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: localized(row.name, row.nameAr),
    slug: row.slug,
    description: row.description ? localized(row.description, row.descriptionAr) : null,
    image: row.image ? img(row.image, null) : null,
    parentId: row.parentId ?? null,
    children: [],
    productCount: null,
  }
}

export function createAdminCategoriesDomain() {
  return {
    async createCategory(input: CreateCategoryInput): Promise<Category> {
      const id = crypto.randomUUID()
      const slug = input.slug ?? slugify(input.name)

      await insertCategory({
        id,
        name: input.name,
        nameAr: input.nameAr ?? null,
        slug,
        description: input.description ?? null,
        descriptionAr: input.descriptionAr ?? null,
        image: input.image ?? null,
        parentId: input.parentId ?? null,
        sortOrder: input.sortOrder ?? 0,
      })

      const row = await findCategoryById(id)
      return mapCategory(row)
    },

    async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
      const updates: Record<string, unknown> = {}

      if (input.name != null) updates.name = input.name
      if (input.nameAr !== undefined) updates.nameAr = input.nameAr
      if (input.slug != null) updates.slug = input.slug
      if (input.description !== undefined) updates.description = input.description
      if (input.descriptionAr !== undefined) updates.descriptionAr = input.descriptionAr
      if (input.image !== undefined) updates.image = input.image
      if (input.parentId !== undefined) updates.parentId = input.parentId
      if (input.sortOrder != null) updates.sortOrder = input.sortOrder

      await updateCategoryById(id, updates)

      const row = await findCategoryById(id)
      return mapCategory(row)
    },

    async deleteCategory(id: string): Promise<void> {
      // Check for children — prevent orphaning
      const children = await findCategoryChildren(id)
      if (children.length > 0) {
        throw new Error(`Cannot delete category ${id}: it has ${children.length} child categories`)
      }

      await deleteCategoryById(id)
    },
  }
}
