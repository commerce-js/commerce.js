// ---------------------------------------------------------------------------
// Admin: Inventory management
// ---------------------------------------------------------------------------

import type { Product } from '@commercejs/types'
import type { UpdateInventoryInput } from './types.js'
import {
  findProductById,
  updateProductById,
  updateProductVariantById,
  findProductImages,
  findProductVariants,
  findProductAttributes,
  findProductCategoryIds,
  findProductTags,
  findCategoryById,
} from '../database/index.js'
import { localized, discountablePrice, img } from '../domains/helpers.js'

/** Minimal product mapping for inventory responses */
function mapProduct(row: any, related: {
  images?: any[]
  variants?: any[]
  attributes?: any[]
  categories?: any[]
  tags?: string[]
}, currency: string): Product {
  const primaryImg = related.images?.find((i: any) => i.isPrimary) ?? related.images?.[0]

  return {
    id: row.id,
    sku: row.sku ?? null,
    name: localized(row.name, row.nameAr),
    slug: row.slug,
    description: localized(row.description, row.descriptionAr),
    shortDescription: localized(row.shortDescription, row.shortDescriptionAr),
    price: discountablePrice(row.price, row.compareAtPrice, row.currency ?? currency),
    primaryImage: primaryImg ? img(primaryImg.url, primaryImg.altText) : null,
    gallery: (related.images ?? []).map((i: any) => img(i.url, i.altText)),
    rating: null,
    variants: (related.variants ?? []).map((v: any) => ({
      id: v.id,
      sku: v.sku ?? null,
      name: v.name ? localized(v.name, v.nameAr) : null,
      price: discountablePrice(v.price, v.compareAtPrice, row.currency ?? currency),
      attributes: [],
      inStock: Boolean(v.inStock),
      inventoryQuantity: v.inventoryQuantity ?? null,
    })),
    options: [],
    attributes: (related.attributes ?? []).map((a: any) => ({
      code: a.code,
      name: localized(a.name, a.nameAr),
      value: localized(a.value, a.valueAr),
    })),
    quantityLimit: row.quantityLimit ?? null,
    categories: (related.categories ?? []).map((c: any) => ({
      id: c.id,
      name: localized(c.name, c.nameAr),
      slug: c.slug,
      description: c.description ? localized(c.description, c.descriptionAr) : null,
      image: c.image ? img(c.image, null) : null,
      parentId: c.parentId ?? null,
      children: [],
      productCount: null,
    })),
    inStock: Boolean(row.inStock),
    vatIncluded: Boolean(row.vatIncluded),
    vatRate: row.vatRate ?? null,
    tags: related.tags ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    productType: row.productType ?? 'physical',
    digital: null,
    service: null,
    event: null,
    subscription: null,
    auction: null,
    rental: null,
    preOrder: null,
    requiresShipping: Boolean(row.requiresShipping),
    minOrderQuantity: null,
    priceTiers: null,
    customerGroupPricing: null,
    isDropshipped: Boolean(row.isDropshipped),
  }
}

async function fetchProductRelations(productId: string) {
  const [images, variants, attributes, categoryIds, tags] = await Promise.all([
    findProductImages(productId),
    findProductVariants(productId),
    findProductAttributes(productId),
    findProductCategoryIds(productId),
    findProductTags(productId),
  ])

  const categories = categoryIds.length > 0
    ? (await Promise.all(categoryIds.map(id => findCategoryById(id)))).filter(Boolean)
    : []

  return { images, variants, attributes, categories, tags }
}

export function createAdminInventoryDomain(currency: string) {
  return {
    async updateInventory(input: UpdateInventoryInput): Promise<void> {
      const adjustment = input.adjustment ?? 'set'

      if (input.variantId) {
        // Update variant inventory
        if (adjustment === 'set') {
          await updateProductVariantById(input.variantId, {
            inventoryQuantity: input.quantity,
            inStock: input.quantity > 0,
          })
        } else {
          const variants = await findProductVariants(input.productId)
          const variant = variants.find((v: any) => v.id === input.variantId)
          if (!variant) throw new Error(`Variant not found: ${input.variantId}`)

          const current = variant.inventoryQuantity ?? 0
          const newQty = adjustment === 'increment' ? current + input.quantity : current - input.quantity
          await updateProductVariantById(input.variantId, {
            inventoryQuantity: Math.max(0, newQty),
            inStock: newQty > 0,
          })
        }
      } else {
        // Update product-level inventory
        if (adjustment === 'set') {
          await updateProductById(input.productId, {
            inventoryQuantity: input.quantity,
            inStock: input.quantity > 0,
          })
        } else {
          const product = await findProductById(input.productId)
          if (!product) throw new Error(`Product not found: ${input.productId}`)

          const current = (product as any).inventoryQuantity ?? 0
          const newQty = adjustment === 'increment' ? current + input.quantity : current - input.quantity
          await updateProductById(input.productId, {
            inventoryQuantity: Math.max(0, newQty),
            inStock: newQty > 0,
          })
        }
      }
    },

    async getLowStockProducts(threshold?: number): Promise<Product[]> {
      const { adminFindLowStockProducts } = await import('../database/drizzle/queries/admin-catalog.js')
      const limit = threshold ?? 10

      const rows = await adminFindLowStockProducts(limit, 50)

      return Promise.all(
        rows.map(async (row) => {
          const related = await fetchProductRelations(row.id)
          return mapProduct(row, related, currency)
        }),
      )
    },
  }
}
