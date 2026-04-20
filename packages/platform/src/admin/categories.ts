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
  findProductIdsByCategory,
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
    sortOrder: row.sortOrder ?? 0,
  }
}

export function createAdminCategoriesDomain() {
  return {
    async listCategories(parentId?: string): Promise<Category[]> {
      const rows = await findCategories(parentId)
      return rows.map(mapCategory)
    },

    async getCategory(id: string): Promise<Category> {
      const row = await findCategoryById(id)
      if (!row) throw new Error(`Category not found: ${id}`)
      return mapCategory(row)
    },

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

      // Parent-chain cycle guard. A category pointed at itself or at one of
      // its own descendants breaks the tree — reject before writing.
      if (input.parentId != null && input.parentId !== '') {
        if (input.parentId === id) {
          throw new Error('Cannot set a category as its own parent')
        }
        let cursor: string | null | undefined = input.parentId
        const seen = new Set<string>()
        while (cursor) {
          if (cursor === id) {
            throw new Error('Cannot set a descendant as the parent (cycle)')
          }
          if (seen.has(cursor)) break // broken pre-existing tree — stop walking
          seen.add(cursor)
          const parentRow: any = await findCategoryById(cursor)
          cursor = parentRow?.parentId ?? null
        }
      }

      await updateCategoryById(id, updates)

      const row = await findCategoryById(id)
      return mapCategory(row)
    },

    async deleteCategory(id: string): Promise<void> {
      // Prevent orphaning: block delete if any children exist.
      const children = await findCategoryChildren(id)
      if (children.length > 0) {
        throw new Error(`Cannot delete category ${id}: it has ${children.length} child categories`)
      }

      // Prevent silent orphaning of product ↔ category links.
      const attachedProductIds = await findProductIdsByCategory(id)
      if (attachedProductIds.length > 0) {
        throw new Error(
          `Cannot delete category ${id}: it has ${attachedProductIds.length} attached product${attachedProductIds.length === 1 ? '' : 's'}`,
        )
      }

      await deleteCategoryById(id)
    },
  }
}
