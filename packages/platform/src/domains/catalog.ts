// ---------------------------------------------------------------------------
// Catalog domain — product and category retrieval
// ---------------------------------------------------------------------------

import type {
  Product,
  Category,
  SearchResult,
  SearchParams,
  GetProductParams,
  GetCategoriesParams,
} from '@commercejs/types'
import {
  findProductById,
  findProductBySlug,
  findProducts,
  findCategories,
  findProductImages,
  findProductVariants,
  findProductAttributes,
  findProductCategoryIds,
  findProductTags,
  findCategoryById,
  findProductIdsByCategory,
} from '../database/index.js'
import { localized, discountablePrice, img } from './helpers.js'

export function createCatalogDomain(currency: string) {
  /** Map a raw product row + relations to the unified Product type */
  function mapProduct(row: any, related: {
    images?: any[]
    variants?: any[]
    attributes?: any[]
    categories?: any[]
    tags?: string[]
  } = {}): Product {
    const primaryImg = related.images?.find((i: any) => i.isPrimary) ?? related.images?.[0]

    return {
      id: row.id,
      sku: row.sku ?? null,
      name: localized(row.name, row.nameAr),
      slug: row.slug,
      description: localized(row.description, row.descriptionAr),
      shortDescription: localized(row.shortDescription, row.shortDescriptionAr),
      price: discountablePrice(row.price, row.compareAtPrice, currency),
      primaryImage: primaryImg ? img(primaryImg.url, primaryImg.altText) : null,
      gallery: (related.images ?? []).map((i: any) => img(i.url, i.altText)),
      rating: null,
      variants: (related.variants ?? []).map((v: any) => ({
        id: v.id,
        sku: v.sku ?? null,
        name: v.name ? localized(v.name, v.nameAr) : null,
        price: discountablePrice(v.price, v.compareAtPrice, currency),
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

  /**
   * Fetch full product relations.
   *
   * Queries are serialized (not parallel) to work around a Drizzle ORM
   * neon-http driver bug where Promise.all causes "Failed query" errors
   * on Cloudflare Workers.
   */
  async function fetchProductRelations(productId: string) {
    const images = await findProductImages(productId)
    const variants = await findProductVariants(productId)
    const attributes = await findProductAttributes(productId)
    const categoryIds = await findProductCategoryIds(productId)
    const tags = await findProductTags(productId)

    const categories: any[] = []
    for (const id of categoryIds) {
      const cat = await findCategoryById(id)
      if (cat) categories.push(cat)
    }

    return { images, variants, attributes, categories, tags }
  }

  return {
    async getProduct(params: GetProductParams): Promise<Product> {
      const row = params.id
        ? await findProductById(params.id)
        : params.slug
          ? await findProductBySlug(params.slug!)
          : null

      if (!row) {
        throw new Error(`Product not found: ${params.id ?? params.slug}`)
      }

      const related = await fetchProductRelations(row.id)
      return mapProduct(row, related)
    },

    async getProducts(params: SearchParams): Promise<SearchResult> {
      const conditions: { field: string; op: 'eq' | 'like' | 'ilike' | 'search' | 'gte' | 'lte' | 'in'; value: any }[] = [
        { field: 'status', op: 'eq', value: 'active' },
      ]

      if (params.query) {
        conditions.push({ field: 'name', op: 'search', value: `%${params.query}%` })
      }
      if (params.categoryId) {
        const productIds = await findProductIdsByCategory(params.categoryId)
        if (productIds.length === 0) {
          return { products: { items: [], total: 0, page: params.page ?? 1, perPage: params.perPage ?? 20, hasMore: false }, facets: [], suggestions: null }
        }
        conditions.push({ field: 'id', op: 'in', value: productIds })
      }

      const minPrice = params.filters?.['minPrice']
      const maxPrice = params.filters?.['maxPrice']
      if (minPrice) {
        conditions.push({ field: 'price', op: 'gte', value: Number(minPrice) })
      }
      if (maxPrice) {
        conditions.push({ field: 'price', op: 'lte', value: Number(maxPrice) })
      }

      const page = params.page ?? 1
      const perPage = params.perPage ?? 20
      const offset = (page - 1) * perPage

      const { rows, total } = await findProducts({
        conditions,
        orderBy: params.sort ? { field: params.sort.field, direction: params.sort.direction } : undefined,
        limit: perPage,
        offset,
      })

      // Serialize product relation fetching — Drizzle neon-http driver
      // doesn't support parallel queries on CF Workers.
      const products: Product[] = []
      for (const row of rows) {
        const related = await fetchProductRelations(row.id)
        products.push(mapProduct(row, related))
      }

      return {
        products: {
          items: products,
          total,
          page,
          perPage,
          hasMore: offset + perPage < total,
        },
        facets: [],
        suggestions: null,
      }
    },

    async getCategories(params?: GetCategoriesParams): Promise<Category[]> {
      const rows = await findCategories(params?.parentId)

      return rows.map(row => ({
        id: row.id,
        name: localized(row.name, row.nameAr),
        slug: row.slug,
        description: row.description ? localized(row.description, row.descriptionAr) : null,
        image: row.image ? img(row.image, null) : null,
        parentId: row.parentId ?? null,
        children: [],
        productCount: null,
      }))
    },
  }
}
