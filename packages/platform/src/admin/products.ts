// ---------------------------------------------------------------------------
// Admin: Product CRUD
// ---------------------------------------------------------------------------

import type { Product } from '@commercejs/types'
import type { AdminListParams, CreateProductInput, UpdateProductInput } from './types.js'
import {
  findProductById,
  findProductBySlug,
  findProductImages,
  findProductVariants,
  findProductAttributes,
  findProductCategoryIds,
  findProductTags,
  findCategoryById,
  insertProduct,
  updateProductById,
  deleteProductById,
  findAllProducts,
  insertProductImage,
  deleteProductImages,
  insertProductVariant,
  deleteProductVariants,
  insertProductAttribute,
  deleteProductAttributes,
  insertProductTag,
  deleteProductTags,
  setProductCategories,
} from '../database/index.js'
import { localized, discountablePrice, img } from '../domains/helpers.js'

/** Generate a URL-safe slug from a product name */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0621-\u064A]+/g, '-')
    .replace(/^-|-$/g, '')
    || crypto.randomUUID().slice(0, 8)
}

/** Map a raw product row + relations to the unified Product type */
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

/** Fetch full product relations */
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

export function createAdminProductsDomain(currency: string) {
  async function fullProduct(id: string): Promise<Product> {
    const row = await findProductById(id)
    if (!row) throw new Error(`Product not found: ${id}`)
    const related = await fetchProductRelations(row.id)
    return mapProduct(row, related, currency)
  }

  return {
    getProduct: fullProduct,

    async createProduct(input: CreateProductInput): Promise<Product> {
      const id = crypto.randomUUID()

      // Generate slug — check for uniqueness
      let slug = input.slug ?? slugify(input.name)
      const existing = await findProductBySlug(slug)
      if (existing) slug = `${slug}-${crypto.randomUUID().slice(0, 6)}`

      await insertProduct({
        id,
        name: input.name,
        nameAr: input.nameAr ?? null,
        slug,
        description: input.description ?? null,
        descriptionAr: input.descriptionAr ?? null,
        shortDescription: input.shortDescription ?? null,
        shortDescriptionAr: input.shortDescriptionAr ?? null,
        price: input.price ?? null,
        compareAtPrice: input.compareAtPrice ?? null,
        currency: input.currency ?? currency,
        sku: input.sku ?? null,
        productType: input.productType ?? 'physical',
        status: input.status ?? 'draft',
        inStock: input.inStock ?? true,
        inventoryQuantity: input.inventoryQuantity ?? null,
        quantityLimit: input.quantityLimit ?? null,
        vatIncluded: input.vatIncluded ?? true,
        vatRate: input.vatRate ?? null,
        requiresShipping: input.requiresShipping ?? true,
        isDropshipped: input.isDropshipped ?? false,
      })

      // Create relations
      if (input.images?.length) {
        for (let i = 0; i < input.images.length; i++) {
          const image = input.images[i]
          await insertProductImage({
            id: crypto.randomUUID(),
            productId: id,
            url: image.url,
            altText: image.altText ?? null,
            sortOrder: image.sortOrder ?? i,
            isPrimary: image.isPrimary ?? (i === 0),
          })
        }
      }

      if (input.variants?.length) {
        for (let i = 0; i < input.variants.length; i++) {
          const v = input.variants[i]
          await insertProductVariant({
            id: crypto.randomUUID(),
            productId: id,
            sku: v.sku ?? null,
            name: v.name ?? null,
            nameAr: v.nameAr ?? null,
            price: v.price ?? null,
            compareAtPrice: v.compareAtPrice ?? null,
            inStock: v.inStock ?? true,
            inventoryQuantity: v.inventoryQuantity ?? null,
            sortOrder: v.sortOrder ?? i,
          })
        }
      }

      if (input.attributes?.length) {
        for (const attr of input.attributes) {
          await insertProductAttribute({
            id: crypto.randomUUID(),
            productId: id,
            code: attr.code,
            name: attr.name,
            nameAr: attr.nameAr ?? null,
            value: attr.value,
            valueAr: attr.valueAr ?? null,
          })
        }
      }

      if (input.tags?.length) {
        for (const tag of input.tags) {
          await insertProductTag({ id: crypto.randomUUID(), productId: id, tag })
        }
      }

      if (input.categories?.length) {
        await setProductCategories(id, input.categories)
      }

      return fullProduct(id)
    },

    async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
      const updates: Record<string, unknown> = {}

      if (input.name != null) updates.name = input.name
      if (input.nameAr !== undefined) updates.nameAr = input.nameAr
      if (input.slug != null) updates.slug = input.slug
      if (input.description !== undefined) updates.description = input.description
      if (input.descriptionAr !== undefined) updates.descriptionAr = input.descriptionAr
      if (input.shortDescription !== undefined) updates.shortDescription = input.shortDescription
      if (input.shortDescriptionAr !== undefined) updates.shortDescriptionAr = input.shortDescriptionAr
      if (input.price !== undefined) updates.price = input.price
      if (input.compareAtPrice !== undefined) updates.compareAtPrice = input.compareAtPrice
      if (input.currency != null) updates.currency = input.currency
      if (input.sku !== undefined) updates.sku = input.sku
      if (input.productType != null) updates.productType = input.productType
      if (input.status != null) updates.status = input.status
      if (input.inStock != null) updates.inStock = input.inStock
      if (input.inventoryQuantity !== undefined) updates.inventoryQuantity = input.inventoryQuantity
      if (input.quantityLimit !== undefined) updates.quantityLimit = input.quantityLimit
      if (input.vatIncluded != null) updates.vatIncluded = input.vatIncluded
      if (input.vatRate !== undefined) updates.vatRate = input.vatRate
      if (input.requiresShipping != null) updates.requiresShipping = input.requiresShipping
      if (input.isDropshipped != null) updates.isDropshipped = input.isDropshipped

      await updateProductById(id, updates)

      // Replace relations if provided
      if (input.images) {
        await deleteProductImages(id)
        for (let i = 0; i < input.images.length; i++) {
          const image = input.images[i]
          await insertProductImage({
            id: crypto.randomUUID(),
            productId: id,
            url: image.url,
            altText: image.altText ?? null,
            sortOrder: image.sortOrder ?? i,
            isPrimary: image.isPrimary ?? (i === 0),
          })
        }
      }

      if (input.variants) {
        await deleteProductVariants(id)
        for (let i = 0; i < input.variants.length; i++) {
          const v = input.variants[i]
          await insertProductVariant({
            id: crypto.randomUUID(),
            productId: id,
            sku: v.sku ?? null,
            name: v.name ?? null,
            nameAr: v.nameAr ?? null,
            price: v.price ?? null,
            compareAtPrice: v.compareAtPrice ?? null,
            inStock: v.inStock ?? true,
            inventoryQuantity: v.inventoryQuantity ?? null,
            sortOrder: v.sortOrder ?? i,
          })
        }
      }

      if (input.attributes) {
        await deleteProductAttributes(id)
        for (const attr of input.attributes) {
          await insertProductAttribute({
            id: crypto.randomUUID(),
            productId: id,
            code: attr.code,
            name: attr.name,
            nameAr: attr.nameAr ?? null,
            value: attr.value,
            valueAr: attr.valueAr ?? null,
          })
        }
      }

      if (input.tags) {
        await deleteProductTags(id)
        for (const tag of input.tags) {
          await insertProductTag({ id: crypto.randomUUID(), productId: id, tag })
        }
      }

      if (input.categories) {
        await setProductCategories(id, input.categories)
      }

      return fullProduct(id)
    },

    async deleteProduct(id: string): Promise<void> {
      await deleteProductById(id)
    },

    async listProducts(params?: AdminListParams) {
      const page = params?.page ?? 1
      const perPage = params?.perPage ?? 20
      const offset = (page - 1) * perPage

      const { rows, total } = await findAllProducts({
        search: params?.search,
        sort: params?.sort,
        limit: perPage,
        offset,
      })

      const products = await Promise.all(
        rows.map(async (row) => {
          const related = await fetchProductRelations(row.id)
          return mapProduct(row, related, currency)
        }),
      )

      return {
        items: products,
        total,
        page,
        perPage,
        hasMore: offset + perPage < total,
      }
    },
  }
}
