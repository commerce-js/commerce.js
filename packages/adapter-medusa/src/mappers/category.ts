// ---------------------------------------------------------------------------
// Category mapper — MedusaProductCategory → Commerce.js Category
// ---------------------------------------------------------------------------

import type { Category } from '@commercejs/types'
import type { MedusaProductCategory } from '../types.js'

/** Map MedusaProductCategory → Commerce.js Category */
export function mapMedusaCategory(c: MedusaProductCategory): Category {
  return {
    id: c.id,
    name: { ar: c.name, en: c.name },
    slug: c.handle,
    description: c.description ? { ar: c.description, en: c.description } : null,
    image: null,
    parentId: c.parent_category_id ?? null,
    children: (c.category_children ?? []).map(child => mapMedusaCategory(child)),
    productCount: null,
  }
}
