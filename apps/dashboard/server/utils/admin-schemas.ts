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

// ---- Customers ----

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sortField: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
})

// ---- Categories ----

// Mirrors CreateCategoryInput in @commercejs/platform/admin. Empty `slug`
// is coerced to `undefined` so the platform's slugify-on-create path fires
// rather than persisting an empty string.
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameAr: z.string().optional(),
  slug: z.string().optional().transform(v => (v === '' ? undefined : v)),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  parentId: z.string().optional().transform(v => (v === '' ? undefined : v)),
  sortOrder: z.number().int().optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

// ---- Staff ----

// Mirrors admin.auth.createAdmin/updateAdmin shapes in @commercejs/platform.
// role is the AdminUser role triad ('owner' | 'admin' | 'editor'). Password
// ≥ 8 chars matches the T09 spec — we don't mirror the platform's hashing
// parameters because those are an implementation detail.
const staffRoleEnum = z.enum(['owner', 'admin', 'editor'])

export const createStaffSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional().transform(v => (v === '' ? undefined : v)),
  role: staffRoleEnum.optional(),
})

export const updateStaffSchema = z.object({
  name: z.string().optional().transform(v => (v === '' ? undefined : v)),
  role: staffRoleEnum.optional(),
}).refine(v => v.name !== undefined || v.role !== undefined, {
  message: 'Provide at least one of name or role',
})

export const changeStaffPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

// ---- Inventory ----

// Mirrors UpdateInventoryInput in @commercejs/platform/admin. `adjustment`
// defaults to 'set' on the platform side; we don't default here so the
// server passes undefined through unchanged.
export const updateInventorySchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int(),
  adjustment: z.enum(['set', 'increment', 'decrement']).optional(),
})

export const lowStockQuerySchema = z.object({
  threshold: z.coerce.number().int().nonnegative().optional(),
})

// ---- Analytics ----

// Accepts an ISO date (YYYY-MM-DD) or a full ISO timestamp. Platform-side
// parseFromBound / parseToBound normalize either form into the correct UTC
// boundary. Granularity is validated by the platform domain as well, but we
// reject invalid values up-front so the response is 400 instead of 500.
const isoDateOrTimestamp = z.string().regex(
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/,
  'Must be an ISO date (YYYY-MM-DD) or ISO timestamp',
)

export const analyticsRangeSchema = z.object({
  granularity: z.enum(['day', 'week', 'month']),
  from: isoDateOrTimestamp,
  to: isoDateOrTimestamp,
})

export const topAnalyticsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  from: isoDateOrTimestamp.optional(),
  to: isoDateOrTimestamp.optional(),
})

// ---- Activity log (T13) ----

export const listActivityQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(200).optional(),
  actorId: z.string().min(1).optional(),
  entityType: z.string().min(1).optional(),
  from: isoDateOrTimestamp.optional(),
  to: isoDateOrTimestamp.optional(),
})

// ---- Store settings ----

// Mirrors UpdateStoreInput in @commercejs/platform/admin. Empty-string
// literals are accepted alongside `undefined` so the UI can clear a field
// (logo, favicon, contactEmail) by sending `''` — the platform's
// `updateStoreSettings` treats an empty string as a valid clear.
export const updateStoreSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  logo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  favicon: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  currency: z.string().length(3, 'Must be a 3-letter ISO currency code').optional(),
  locale: z.string().min(2).optional(),
  timezone: z.string().min(1).optional(),
  contactEmail: z.string().email('Must be a valid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z.string().optional(), // JSON string of Record<string, string>
  // T12 theming. Empty string clears; undefined leaves the DB value untouched.
  // `primaryColor` / `accentColor` accept any CSS color the admin sends — the
  // native <input type="color"> emits `#rrggbb`, but we don't hard-fail other
  // syntaxes (rgb(), hsl()) so a paste-in works.
  primaryColor: z.string().max(64, 'Color must be under 64 chars').optional().or(z.literal('')),
  accentColor: z.string().max(64, 'Color must be under 64 chars').optional().or(z.literal('')),
  fontFamily: z.string().max(128, 'Font family must be under 128 chars').optional().or(z.literal('')),
  heroImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  heroHeadingEn: z.string().max(200, 'Heading must be under 200 chars').optional().or(z.literal('')),
  heroHeadingAr: z.string().max(200, 'Heading must be under 200 chars').optional().or(z.literal('')),
})
