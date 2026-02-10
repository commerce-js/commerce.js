// ---------------------------------------------------------------------------
// Salla adapter configuration & raw API response types
// ---------------------------------------------------------------------------

/** Configuration for the Salla adapter */
export interface SallaConfig {
  /** OAuth 2.0 Bearer token or personal access token */
  accessToken: string
  /** OAuth 2.0 refresh token (for automatic token refresh on expiry) */
  refreshToken?: string
  /** Salla OAuth client ID (required for token refresh) */
  clientId?: string
  /** Salla OAuth client secret (required for token refresh) */
  clientSecret?: string
  /** Store ID (optional — some endpoints infer from token) */
  storeId?: string
  /** Default locale for bilingual fields (default: 'ar') */
  locale?: 'ar' | 'en'
  /** Default currency code (default: 'SAR') */
  currency?: string
  /** API base URL override (default: https://api.salla.dev/admin/v2) */
  baseUrl?: string
  /** Request timeout in ms (default: 10000) */
  timeout?: number
}

// ---------------------------------------------------------------------------
// Salla raw API response shapes (what the API actually returns)
// ---------------------------------------------------------------------------

/** Salla's standard paginated response wrapper */
export interface SallaApiResponse<T> {
  status: number
  success: boolean
  data: T
  pagination?: {
    count: number
    total: number
    perPage: number
    currentPage: number
    totalPages: number
  }
}

/** Raw Salla product from GET /products */
export interface SallaRawProduct {
  id: number
  sku: string | null
  name: string
  description: string | null
  short_description: string | null
  slug: string
  status: 'sale' | 'out' | 'hidden' | 'deleted'
  type: 'product' | 'service' | 'digital' | 'codes' | 'food' | 'group_products'
  price: {
    amount: number
    currency: string
  }
  sale_price: {
    amount: number
    currency: string
  } | null
  regular_price: {
    amount: number
    currency: string
  }
  quantity: number | null
  max_quantity_per_order: number | null
  min_quantity_per_order: number | null
  images: SallaRawImage[]
  categories: Array<{ id: number; name: string; slug: string }>
  options: SallaRawOption[]
  skus: SallaRawSku[]
  tags: Array<{ name: string }>
  brand: { id: number; name: string; slug: string } | null
  rating: {
    count: number
    average: number
  } | null
  weight: number | null
  weight_unit: string | null
  require_shipping: boolean
  urls: { customer: string; admin: string }
  promotion: {
    title: string | null
    sub_title: string | null
  } | null
  has_options: boolean
  is_available: boolean
  created_at: string
  updated_at: string
  metadata: Record<string, unknown> | null
}

export interface SallaRawImage {
  id: number
  url: string
  alt: string | null
  sort: number
  main: boolean
  type: string
  three_d_image_url: string | null
  video_url: string | null
}

export interface SallaRawOption {
  id: number
  name: string
  display_type: string
  values: Array<{
    id: number
    name: string
    price: { amount: number; currency: string } | null
    display_value: string | null
  }>
}

export interface SallaRawSku {
  id: number
  sku: string | null
  price: { amount: number; currency: string }
  sale_price: { amount: number; currency: string } | null
  regular_price: { amount: number; currency: string }
  stock_quantity: number | null
  is_available?: boolean
  related_option_values: number[]
}

/** Raw Salla category from GET /categories */
export interface SallaRawCategory {
  id: number
  name: string
  slug: string
  description: string | null
  image: SallaRawImage | null
  parent_id: number | null
  sort_order: number
  status: 'active' | 'hidden'
  urls: { customer: string; admin: string }
  products_count: number
  created_at: string
  updated_at: string
}

/** Raw Salla customer */
export interface SallaRawCustomer {
  id: number
  first_name: string
  last_name: string
  full_name?: string
  mobile: string | number
  mobile_code: string
  email: string
  avatar: string | null
  gender: string | null
  birthday: string | { date: string; timezone_type: number; timezone: string } | null
  city: string | null
  country: string | null
  currency: string
  urls: { customer: string; admin: string }
  created_at: string | { date: string; timezone_type: number; timezone: string }
  updated_at: string | { date: string; timezone_type: number; timezone: string }
}

/** Raw Salla order */
export interface SallaRawOrder {
  id: number
  reference_id: number | string
  status: {
    id: number
    name: string
    slug: string
    customized: { id: number; name: string } | null
  }
  payment_method: string | null
  currency: string
  amounts: {
    total: { amount: number; currency: string }
    sub_total: { amount: number; currency: string }
    shipping_cost: { amount: number; currency: string }
    cash_on_delivery: { amount: number; currency: string }
    tax: { percent: string; amount: { amount: number; currency: string } }
    discounts: Array<{ amount: number; currency: string }>
  }
  /** Items shape varies: listing has {name, quantity, thumbnail}, detail has full items */
  items: SallaRawOrderItem[]
  customer: SallaRawCustomer | null
  shipping: {
    company: string | null
    receiver: { name: string; phone: string } | null
    address: SallaRawAddress | null
    shipment: { tracking_link: string | null; tracking_number: string | null } | null
  } | null
  coupon: { code: string; discount: number } | null
  note: string | null
  urls: { customer: string; admin: string }
  created_at: string | { date: string; timezone_type: number; timezone: string }
  updated_at: string | { date: string; timezone_type: number; timezone: string }
  date: { date: string; timezone_type: number; timezone: string }
}

export interface SallaRawOrderItem {
  id?: number
  product_id?: number
  sku?: string | null
  name: string
  quantity: number
  thumbnail?: string
  image?: SallaRawImage | null
  price?: { amount: number; currency: string }
  total?: { amount: number; currency: string }
  options?: Array<{ name: string; value: string }>
}

export interface SallaRawAddress {
  id: number
  city: string | null
  country: string | null
  country_code: string | null
  street_number: string | null
  block: string | null
  postal_code: string | null
  lat: string | null
  lng: string | null
}

/** Raw Salla review */
export interface SallaRawReview {
  id: number
  content: string
  rating: number
  customer: { id: number; name: string; avatar: string | null } | null
  product_id: number
  status: 'published' | 'pending' | 'spam'
  created_at: string
  updated_at: string
}

/** Raw Salla shipping company */
export interface SallaRawShippingCompany {
  id: number
  name: string
  logo: string | null
  tracking_url: string | null
}

/** Raw Salla payment method */
export interface SallaRawPaymentMethod {
  id: number
  name: string
  slug?: string
  logo?: string | null
  is_default?: boolean
}

/** Raw Salla coupon */
export interface SallaRawCoupon {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  amount: number
  start_date: string | null
  expiry_date: string | null
  maximum_amount: number | null
  free_shipping: boolean
  exclude_sale_products: boolean
  usage_count: number
  usage_limit: number | null
  minimum_amount: number | null
  status: 'active' | 'expired' | 'disabled'
}

/** Raw Salla store info */
export interface SallaRawStoreInfo {
  id: number
  name: string
  description: string | null
  avatar: string | null
  logo: string | null
  domain: string
  tax_number: string | null
  commercial_number: string | null
  plan: string
  status: string
  social: Record<string, string | null>
}

/** Raw Salla currency */
export interface SallaRawCurrency {
  code: string
  name: string
  symbol: string
  amount: number
  is_default: boolean
}

/** Raw Salla brand */
export interface SallaRawBrand {
  id: number
  name: string
  description: string | null
  logo: string | null
  slug: string | null
  status: string
}

/** Raw Salla country */
export interface SallaRawCountry {
  id: number
  name: string
  name_en: string
  code: string
  mobile_code: string
  capital: string | null
}

/** Raw Salla branch / store location */
export interface SallaRawBranch {
  id: number
  name: string
  status: string
  is_default: boolean
  location: { lat: string; lng: string } | null
  short_address: string | null
  street: string | null
  address_description: string | null
  postal_code: string | null
  contacts: {
    phone: string | null
    whatsapp: string | null
    telephone: string | null
  } | null
  working_hours: Array<{
    day: string
    from: string | null
    to: string | null
    is_closed?: boolean
  }>
  is_open: boolean
  is_cod_available: boolean
  pickable: boolean
  shippable: boolean
  country: { id: number; name: string; name_en: string; code: string } | null
  city: { id: number; name: string; name_en: string } | null
  region: { id: number; name: string; code: string } | null
}

/** Raw Salla order status from GET /orders/statuses */
export interface SallaRawOrderStatus {
  id: number
  name: string
  type: 'original' | 'custom'
  slug: string
  message: string | null
  color: string | null
  icon: string | null
  sort: number
  is_active: boolean
  original: { id: number; name: string } | null
  parent: { id: number; name: string } | null
  children: SallaRawOrderStatus[] | null
}

/** Raw Salla order history entry from GET /orders/histories */
export interface SallaRawOrderHistory {
  id: number
  action: string
  note: string | null
  created_at: string | { date: string; timezone_type: number; timezone: string }
}
