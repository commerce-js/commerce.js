// ---------------------------------------------------------------------------
// admin-schemas — Zod schemas for /api/admin/* bodies
// ---------------------------------------------------------------------------
//
// Shapes mirror the CreateProductInput / UpdateProductInput types in
// @commercejs/platform/admin — we re-declare them as Zod because the types
// live in that package and can't be introspected at runtime. Keep them in
// sync. When adding a field to CreateProductInput, add it here.
// ---------------------------------------------------------------------------

import { z } from 'zod'

const productImageSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  altText: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isPrimary: z.boolean().optional(),
})

const productVariantSchema = z.object({
  sku: z.string().optional(),
  name: z.string().optional(),
  nameAr: z.string().optional(),
  price: z.number().nonnegative().optional(),
  compareAtPrice: z.number().nonnegative().optional(),
  inStock: z.boolean().optional(),
  inventoryQuantity: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
})

const productAttributeSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nameAr: z.string().optional(),
  value: z.string().min(1),
  valueAr: z.string().optional(),
})

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameAr: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  shortDescription: z.string().optional(),
  shortDescriptionAr: z.string().optional(),
  price: z.number().nonnegative().optional(),
  compareAtPrice: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  sku: z.string().optional(),
  productType: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  inStock: z.boolean().optional(),
  inventoryQuantity: z.number().int().optional(),
  quantityLimit: z.number().int().optional(),
  vatIncluded: z.boolean().optional(),
  vatRate: z.number().nonnegative().optional(),
  requiresShipping: z.boolean().optional(),
  isDropshipped: z.boolean().optional(),
  categories: z.array(z.string()).optional(),
  images: z.array(productImageSchema).optional(),
  variants: z.array(productVariantSchema).optional(),
  attributes: z.array(productAttributeSchema).optional(),
  tags: z.array(z.string()).optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  sortField: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
})

// ---- Orders ----

const orderStatusEnum = z.enum([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'returned',
])

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
  status: orderStatusEnum.optional(),
  customerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
})

export const fulfillOrderSchema = z.object({
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url('Must be a valid URL').optional(),
  note: z.string().optional(),
})

export const refundOrderSchema = z.object({
  note: z.string().optional(),
})
