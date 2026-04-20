// ---------------------------------------------------------------------------
// useAdminProductForm — helper to turn ProductFormValue into the payload
// shape that /api/admin/products expects. Shared between create & edit.
// ---------------------------------------------------------------------------

import type { ProductFormValue } from '../components/AdminProductForm.vue'

interface ProductPayloadImage {
  url: string
  altText?: string
  sortOrder: number
  isPrimary: boolean
}

interface ProductPayload {
  name: string
  nameAr?: string
  slug?: string
  description?: string
  descriptionAr?: string
  shortDescription?: string
  sku?: string
  status: 'draft' | 'active' | 'archived'
  price?: number
  compareAtPrice?: number
  vatIncluded: boolean
  vatRate?: number
  inStock: boolean
  inventoryQuantity?: number
  quantityLimit?: number
  requiresShipping: boolean
  categories: string[]
  tags: string[]
  attributes: { code: string, name: string, value: string }[]
  images: ProductPayloadImage[]
}

export function useAdminProductForm() {
  function toPayload(v: ProductFormValue, opts: { publish?: boolean } = {}): ProductPayload {
    const status = opts.publish === true
      ? 'active'
      : opts.publish === false
        ? 'draft'
        : v.status

    const tags = v.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const attributes = v.attributes
      .filter(a => a.code.trim() && a.name.trim() && a.value.trim())

    const images: ProductPayloadImage[] = v.images.map((img, idx) => {
      const out: ProductPayloadImage = {
        url: img.url,
        sortOrder: idx,
        isPrimary: img.isPrimary,
      }
      const alt = img.altText.trim()
      if (alt) out.altText = alt
      return out
    })

    // If the user didn't mark a primary explicitly, fall back to index 0.
    if (images.length > 0 && !images.some(i => i.isPrimary)) {
      images[0]!.isPrimary = true
    }

    const payload: ProductPayload = {
      name: v.name.trim(),
      status,
      vatIncluded: v.vatIncluded,
      inStock: v.inStock,
      requiresShipping: v.requiresShipping,
      categories: v.categories,
      tags,
      attributes,
      images,
    }

    if (v.nameAr.trim()) payload.nameAr = v.nameAr.trim()
    if (v.slug.trim()) payload.slug = v.slug.trim()
    if (v.description.trim()) payload.description = v.description.trim()
    if (v.descriptionAr.trim()) payload.descriptionAr = v.descriptionAr.trim()
    if (v.shortDescription.trim()) payload.shortDescription = v.shortDescription.trim()
    if (v.sku.trim()) payload.sku = v.sku.trim()
    if (v.price != null) payload.price = v.price
    if (v.compareAtPrice != null) payload.compareAtPrice = v.compareAtPrice
    if (v.vatRate != null) payload.vatRate = v.vatRate
    if (v.inventoryQuantity != null) payload.inventoryQuantity = v.inventoryQuantity
    if (v.quantityLimit != null) payload.quantityLimit = v.quantityLimit

    return payload
  }

  return { toPayload }
}
