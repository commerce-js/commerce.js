// ---------------------------------------------------------------------------
// Medusa V2 raw API types — shapes returned by the Store API
// ---------------------------------------------------------------------------
// These represent the actual JSON payloads from Medusa's REST endpoints.
// Mappers in ./mappers/ convert these to the unified Commerce.js types.
// ---------------------------------------------------------------------------

// ---- Configuration ----

export interface MedusaConfig {
  /** Medusa backend base URL (e.g. 'http://localhost:9000') */
  baseUrl: string
  /** Publishable API key — required for all Store API requests */
  publishableApiKey: string
  /** JWT token for authenticated customer requests */
  apiToken?: string
  /** Default region ID used when creating carts */
  defaultRegionId?: string
  /** Request timeout in milliseconds */
  timeout?: number
}

// ---- Pagination ----

export interface MedusaPaginatedResponse<T> {
  count: number
  offset: number
  limit: number
  [key: string]: T[] | number | string | undefined
}

// ---- Product ----

export interface MedusaMoneyAmount {
  id: string
  amount: number
  currency_code: string
  min_quantity?: number | null
  max_quantity?: number | null
}

export interface MedusaProductOptionValue {
  id: string
  value: string
  option_id: string
  option?: MedusaProductOption
}

export interface MedusaProductOption {
  id: string
  title: string
  product_id: string
  values?: MedusaProductOptionValue[]
}

export interface MedusaProductVariant {
  id: string
  title: string
  sku: string | null
  barcode: string | null
  ean: string | null
  upc: string | null
  manage_inventory: boolean
  allow_backorder: boolean
  inventory_quantity?: number
  calculated_price?: {
    calculated_amount: number
    original_amount: number
    currency_code: string
  }
  options?: MedusaProductOptionValue[]
  prices?: MedusaMoneyAmount[]
  created_at: string
  updated_at: string
}

export interface MedusaProductImage {
  id: string
  url: string
  alt_text?: string | null
  width?: number
  height?: number
}

export interface MedusaProductTag {
  id: string
  value: string
}

export interface MedusaProduct {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  handle: string
  is_giftcard: boolean
  status: string
  thumbnail: string | null
  images?: MedusaProductImage[]
  options?: MedusaProductOption[]
  variants?: MedusaProductVariant[]
  tags?: MedusaProductTag[]
  categories?: MedusaProductCategory[]
  collection_id: string | null
  type_id: string | null
  weight: number | null
  length: number | null
  height: number | null
  width: number | null
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown> | null
}

// ---- Category ----

export interface MedusaProductCategory {
  id: string
  name: string
  description: string | null
  handle: string
  is_active: boolean
  is_internal: boolean
  rank: number
  parent_category_id: string | null
  parent_category?: MedusaProductCategory | null
  category_children?: MedusaProductCategory[]
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown> | null
}

// ---- Cart ----

export interface MedusaLineItem {
  id: string
  cart_id: string
  title: string
  description: string | null
  thumbnail: string | null
  quantity: number
  variant_id: string | null
  product_id: string | null
  unit_price: number
  total: number
  subtotal: number
  discount_total: number
  tax_total: number
  original_total: number
  variant?: MedusaProductVariant | null
  product?: MedusaProduct | null
  created_at: string
  updated_at: string
}

export interface MedusaAddress {
  id?: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  company: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  province: string | null
  country_code: string | null
  postal_code: string | null
  metadata?: Record<string, unknown> | null
}

export interface MedusaShippingMethod {
  id: string
  shipping_option_id: string
  name?: string
  amount: number
  data?: Record<string, unknown>
}

export interface MedusaCart {
  id: string
  region_id: string | null
  customer_id: string | null
  email: string | null
  currency_code: string
  items?: MedusaLineItem[]
  shipping_address?: MedusaAddress | null
  billing_address?: MedusaAddress | null
  shipping_methods?: MedusaShippingMethod[]
  payment_collection?: MedusaPaymentCollection | null
  subtotal: number
  shipping_total: number
  tax_total: number
  discount_total: number
  total: number
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown> | null
}

// ---- Customer ----

export interface MedusaCustomer {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  has_account: boolean
  addresses?: MedusaCustomerAddress[]
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown> | null
}

export interface MedusaCustomerAddress {
  id: string
  customer_id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  company: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  province: string | null
  country_code: string | null
  postal_code: string | null
  is_default_shipping: boolean
  is_default_billing: boolean
  metadata?: Record<string, unknown> | null
}

// ---- Order ----

export interface MedusaOrderItem {
  id: string
  order_id: string
  title: string
  description: string | null
  thumbnail: string | null
  variant_id: string | null
  product_id: string | null
  quantity: number
  unit_price: number
  subtotal: number
  total: number
  tax_total: number
  discount_total: number
  fulfilled_quantity?: number
  created_at: string
  updated_at: string
}

export interface MedusaOrder {
  id: string
  display_id: number
  status: string
  fulfillment_status: string
  payment_status: string
  customer_id: string | null
  email: string | null
  currency_code: string
  items?: MedusaOrderItem[]
  shipping_address?: MedusaAddress | null
  billing_address?: MedusaAddress | null
  shipping_methods?: MedusaShippingMethod[]
  subtotal: number
  shipping_total: number
  tax_total: number
  discount_total: number
  total: number
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown> | null
}

// ---- Region ----

export interface MedusaRegionCountry {
  iso_2: string
  iso_3: string
  name: string
  display_name: string
  num_code: number
}

export interface MedusaRegion {
  id: string
  name: string
  currency_code: string
  countries?: MedusaRegionCountry[]
  tax_rate: number
  automatic_taxes: boolean
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown> | null
}

// ---- Shipping Options ----

export interface MedusaShippingOption {
  id: string
  name: string
  amount: number
  is_return: boolean
  provider_id: string
  data?: Record<string, unknown>
  metadata?: Record<string, unknown> | null
}

// ---- Payment ----

export interface MedusaPaymentSession {
  id: string
  provider_id: string
  status: string
  amount: number
  currency_code: string
  data?: Record<string, unknown>
}

export interface MedusaPaymentCollection {
  id: string
  status: string
  amount: number
  currency_code: string
  payment_sessions?: MedusaPaymentSession[]
}

// ---- Auth ----

export interface MedusaAuthResponse {
  token: string
}
