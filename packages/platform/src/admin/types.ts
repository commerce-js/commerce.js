// ---------------------------------------------------------------------------
// Admin API types — platform-only input/output types for merchant operations
// ---------------------------------------------------------------------------

import type { PaginationParams, PaginatedResult, Order, Product, Customer, Category, LocalizedString } from '@commercejs/types'

// ---- Admin Users ----

export interface AdminUser {
  id: string
  email: string
  passwordHash: string
  name: string | null
  role: 'owner' | 'admin' | 'editor'
  /**
   * Lifecycle state. `'active'` is the only value set by T09's local-password
   * CRUD. `'invited'` is reserved for a future email-invite flow (token
   * pending acceptance); `'disabled'` is reserved for a future "deactivate"
   * action that stops at login without deleting the row.
   */
  status: 'active' | 'invited' | 'disabled'
  createdAt: string
  updatedAt: string
}

/** Admin user without the password hash — safe for API responses */
export type AdminUserSafe = Omit<AdminUser, 'passwordHash'>

// ---- Generic ----

export interface AdminListParams extends PaginationParams {
  search?: string
  sort?: { field: string; direction: 'asc' | 'desc' }
}

export interface AdminListProductsParams extends AdminListParams {
  status?: 'draft' | 'active' | 'archived'
}

// ---- Products ----

export interface CreateProductInput {
  name: string
  nameAr?: string
  slug?: string
  description?: string
  descriptionAr?: string
  shortDescription?: string
  shortDescriptionAr?: string
  price?: number
  compareAtPrice?: number
  currency?: string
  sku?: string
  productType?: string
  status?: 'draft' | 'active' | 'archived'
  inStock?: boolean
  inventoryQuantity?: number
  quantityLimit?: number
  vatIncluded?: boolean
  vatRate?: number
  requiresShipping?: boolean
  isDropshipped?: boolean
  categories?: string[]
  images?: CreateProductImageInput[]
  variants?: CreateVariantInput[]
  attributes?: CreateAttributeInput[]
  tags?: string[]
}

export type UpdateProductInput = Partial<CreateProductInput>

export interface CreateProductImageInput {
  url: string
  altText?: string
  sortOrder?: number
  isPrimary?: boolean
}

export interface CreateVariantInput {
  sku?: string
  name?: string
  nameAr?: string
  price?: number
  compareAtPrice?: number
  inStock?: boolean
  inventoryQuantity?: number
  sortOrder?: number
}

export interface CreateAttributeInput {
  code: string
  name: string
  nameAr?: string
  value: string
  valueAr?: string
}

// ---- Categories ----

export interface CreateCategoryInput {
  name: string
  nameAr?: string
  slug?: string
  description?: string
  descriptionAr?: string
  image?: string
  parentId?: string
  sortOrder?: number
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>

// ---- Orders ----

export interface AdminListOrdersParams extends PaginationParams {
  status?: string
  customerId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface FulfillOrderInput {
  trackingNumber?: string
  trackingUrl?: string
  note?: string
}

// ---- Store ----

export interface UpdateStoreInput {
  name?: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  logo?: string
  favicon?: string
  currency?: string
  locale?: string
  timezone?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  socialLinks?: string
  // T12 — theming. Empty string clears; undefined leaves untouched.
  primaryColor?: string
  accentColor?: string
  fontFamily?: string
  heroImageUrl?: string
  heroHeadingEn?: string
  heroHeadingAr?: string
}

export interface StoreSettings {
  name: string
  nameAr?: string | null
  description?: string | null
  descriptionAr?: string | null
  logo?: string | null
  favicon?: string | null
  currency: string
  locale: string
  timezone: string
  supportedCurrencies: string[]
  supportedLocales: string[]
  contactEmail?: string | null
  contactPhone?: string | null
  address?: string | null
  socialLinks?: Record<string, string> | null
  // T12 — theming.
  primaryColor?: string | null
  accentColor?: string | null
  fontFamily?: string | null
  heroImageUrl?: string | null
  heroHeadingEn?: string | null
  heroHeadingAr?: string | null
}

// ---- Inventory ----

export interface UpdateInventoryInput {
  productId: string
  variantId?: string
  quantity: number
  adjustment?: 'set' | 'increment' | 'decrement'
}

// ---- Dashboard Stats ----

export interface DashboardStats {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  recentOrders: Order[]
  ordersByStatus: Record<string, number>
  /** Average order value across non-cancelled, non-refunded orders. 0 when no qualifying orders. */
  avgOrderValue: number
  /** Refunded / (total − cancelled). 0 when denominator is 0. Always in [0, 1]. */
  refundRate: number
}

// ---- Analytics ----

export type AnalyticsGranularity = 'day' | 'week' | 'month'

export interface RevenueTimeSeriesParams {
  granularity: AnalyticsGranularity
  from: string
  to: string
}

export interface RevenueBucket {
  bucket: string
  revenue: number
  orderCount: number
}

export interface TopProductsParams {
  limit?: number
  from?: string
  to?: string
}

export interface TopProduct {
  productId: string
  name: LocalizedString
  sku: string | null
  unitsSold: number
  revenue: number
}

export interface TopCustomersParams {
  limit?: number
  from?: string
  to?: string
}

export interface TopCustomer {
  customerId: string
  email: string
  orderCount: number
  lifetimeValue: number
}

// ---- Activity log ----

/** Append-only row written when merchant staff perform any admin mutation. */
export interface ActivityEvent {
  id: string
  /** admin_users.id at the time of the event; null for system / unauthenticated actors */
  actorId: string | null
  /** Snapshot of the actor's email at event time so rows still render after the admin is deleted */
  actorEmail: string
  /** Namespaced verb — e.g. 'order.fulfilled', 'product.created', 'settings.updated' */
  action: string
  /** Top-level noun — 'order' | 'product' | 'settings' | 'customer' | 'category' | 'staff' | 'inventory' | 'store' */
  entityType: string
  entityId: string | null
  /** Changed keys only; never a full entity snapshot. Shape is action-specific. */
  diff: Record<string, unknown> | null
  createdAt: string
}

export interface RecordActivityInput {
  actorId: string | null
  actorEmail: string
  action: string
  entityType: string
  entityId?: string | null
  diff?: Record<string, unknown> | null
}

export interface ListActivityParams {
  page?: number
  perPage?: number
  actorId?: string
  entityType?: string
  from?: string
  to?: string
}

// ---- Admin API ----

export interface AdminAPI {
  // Auth
  auth: {
    login(email: string, password: string): Promise<AdminUserSafe>
    changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<void>
    createAdmin(input: { email: string; password: string; name?: string; role?: 'owner' | 'admin' | 'editor' }): Promise<AdminUserSafe>
    listAdmins(): Promise<AdminUserSafe[]>
    getAdmin(id: string): Promise<AdminUserSafe>
    updateAdmin(id: string, input: { name?: string | null; role?: 'owner' | 'admin' | 'editor' }): Promise<AdminUserSafe>
    deleteAdmin(id: string): Promise<void>
    seedInitialAdmin(): Promise<void>
  }

  // Products
  getProduct(id: string): Promise<Product>
  createProduct(input: CreateProductInput): Promise<Product>
  updateProduct(id: string, input: UpdateProductInput): Promise<Product>
  deleteProduct(id: string): Promise<void>
  listProducts(params?: AdminListProductsParams): Promise<PaginatedResult<Product>>

  // Categories
  listCategories(parentId?: string): Promise<Category[]>
  getCategory(id: string): Promise<Category>
  createCategory(input: CreateCategoryInput): Promise<Category>
  updateCategory(id: string, input: UpdateCategoryInput): Promise<Category>
  deleteCategory(id: string): Promise<void>

  // Orders (admin view — all orders, not customer-scoped)
  listOrders(params?: AdminListOrdersParams): Promise<PaginatedResult<Order>>
  getOrder(id: string): Promise<Order>
  fulfillOrder(id: string, input: FulfillOrderInput): Promise<void>
  refundOrder(id: string, note?: string): Promise<void>

  // Customers (admin view)
  listCustomers(params?: AdminListParams): Promise<PaginatedResult<Customer>>
  getCustomer(id: string): Promise<Customer>
  deleteCustomer(id: string): Promise<void>

  // Store settings
  getStoreSettings(): Promise<StoreSettings>
  updateStoreSettings(input: UpdateStoreInput): Promise<StoreSettings>

  // Inventory
  updateInventory(input: UpdateInventoryInput): Promise<void>
  getLowStockProducts(threshold?: number): Promise<Product[]>

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>

  // Analytics
  getRevenueTimeSeries(params: RevenueTimeSeriesParams): Promise<RevenueBucket[]>
  getTopProducts(params?: TopProductsParams): Promise<TopProduct[]>
  getTopCustomers(params?: TopCustomersParams): Promise<TopCustomer[]>

  // Activity log (audit trail)
  recordActivity(input: RecordActivityInput): Promise<void>
  listActivity(params?: ListActivityParams): Promise<PaginatedResult<ActivityEvent>>
}
