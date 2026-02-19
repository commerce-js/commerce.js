// ---------------------------------------------------------------------------
// PlatformAdapter — native commerce engine implementing CommerceAdapter
// ---------------------------------------------------------------------------

import type { CommerceAdapter, AdapterDomain } from '@commercejs/types'
import type { PlatformConfig } from './types.js'
import type { AdminAPI } from './admin/types.js'
import { createAdminAPI } from './admin/index.js'
import { createCatalogDomain } from './domains/catalog.js'
import { createCartDomain } from './domains/cart.js'
import { createCheckoutDomain } from './domains/checkout.js'
import { createCustomersDomain } from './domains/customers.js'
import { createOrdersDomain } from './domains/orders.js'
import { createStoreDomain } from './domains/store.js'
import { createBrandsDomain } from './domains/brands.js'
import { createCountriesDomain } from './domains/countries.js'
import { createWishlistDomain } from './domains/wishlist.js'
import { createReviewsDomain } from './domains/reviews.js'
import { createPromotionsDomain } from './domains/promotions.js'
import { createReturnsDomain } from './domains/returns.js'
import {
  wholesaleStubs,
  auctionStubs,
  rentalStubs,
  giftCardStubs,
  locationStubs,
} from './domains/not-supported.js'

/**
 * Resolve the database connection string from config or environment.
 */
function resolveConnectionString(config: PlatformConfig): string {
  const url = config.connectionString
    ?? globalThis.process?.env?.DATABASE_URL
    ?? ''
  if (!url) {
    throw new Error(
      'DATABASE_URL is required. Pass `connectionString` in config or set DATABASE_URL env var.',
    )
  }
  return url
}

/**
 * Initialize the database — PostgreSQL via Neon serverless (Drizzle).
 */
async function initDatabase(connectionString: string) {
  const { initDrizzle } = await import('./database/drizzle/client.js')
  initDrizzle(connectionString)
}

/** Result of createPlatformAdapter — storefront adapter + admin API */
export interface PlatformAdapterResult {
  /** Storefront adapter implementing CommerceAdapter */
  adapter: CommerceAdapter
  /** Admin API for merchant operations (platform-only) */
  admin: AdminAPI
}

/**
 * Create a PlatformAdapter — the native CommerceJS commerce engine.
 *
 * Returns both the storefront adapter and the admin API.
 *
 * @example
 * ```ts
 * const { adapter, admin } = await createPlatformAdapter({
 *   connectionString: process.env.DATABASE_URL,
 *   currency: 'SAR',
 * })
 * ```
 */
export async function createPlatformAdapter(config: PlatformConfig = {}): Promise<PlatformAdapterResult> {
  const currency = config.currency ?? 'SAR'
  const connectionString = resolveConnectionString(config)

  // Auto-initialize the database
  await initDatabase(connectionString)

  const catalog = createCatalogDomain(currency)
  const cart = createCartDomain(currency)
  const checkout = createCheckoutDomain(currency)
  const customers = createCustomersDomain()
  const orders = createOrdersDomain(currency)
  const store = createStoreDomain()
  const brands = createBrandsDomain()
  const countries = createCountriesDomain()
  const wishlist = createWishlistDomain()
  const reviewsDomain = createReviewsDomain()
  const promotionsDomain = createPromotionsDomain()
  const returnsDomain = createReturnsDomain()

  // Build the admin API
  const admin = createAdminAPI(currency)

  // Seed the initial admin from env vars if no admins exist yet
  await admin.auth.seedInitialAdmin()

  const adapter = {
    name: 'commercejs',
    capabilities: ['catalog', 'cart', 'checkout', 'orders', 'customers', 'store', 'brands', 'countries', 'wishlist', 'reviews', 'promotions', 'returns'] as AdapterDomain[],

    // ---- Catalog ----
    getProduct: catalog.getProduct,
    getProducts: catalog.getProducts,
    getCategories: catalog.getCategories,

    // ---- Cart ----
    createCart: cart.createCart,
    getCart: cart.getCart,
    addToCart: cart.addToCart,
    updateCartItem: cart.updateCartItem,
    removeFromCart: cart.removeFromCart,
    applyCoupon: cart.applyCoupon,
    removeCoupon: cart.removeCoupon,

    // ---- Checkout ----
    getShippingMethods: checkout.getShippingMethods,
    setShippingAddress: checkout.setShippingAddress,
    setBillingAddress: checkout.setBillingAddress,
    setShippingMethod: checkout.setShippingMethod,
    getPaymentMethods: checkout.getPaymentMethods,
    setPaymentMethod: checkout.setPaymentMethod,
    placeOrder: checkout.placeOrder,

    // ---- Customers ----
    login: customers.login,
    register: customers.register,
    getCustomer: customers.getCustomer,
    updateCustomer: customers.updateCustomer,
    logout: customers.logout,
    forgotPassword: customers.forgotPassword,
    resetPassword: customers.resetPassword,
    getAddresses: customers.getAddresses,
    addAddress: customers.addAddress,
    updateAddress: customers.updateAddress,
    deleteAddress: customers.deleteAddress,

    // ---- Orders ----
    createOrder: orders.createOrder,
    getOrder: orders.getOrder,
    getCustomerOrders: orders.getCustomerOrders,
    getOrderStatuses: orders.getOrderStatuses,
    updateOrderStatus: orders.updateOrderStatus,
    cancelOrder: orders.cancelOrder,
    duplicateOrder: orders.duplicateOrder,
    getOrderHistory: orders.getOrderHistory,

    // ---- Store ----
    getStoreInfo: store.getStoreInfo,

    // ---- Brands ----
    getBrands: brands.getBrands,

    // ---- Countries ----
    getCountries: countries.getCountries,

    // ---- Wishlist ----
    getWishlist: wishlist.getWishlist,
    addToWishlist: wishlist.addToWishlist,
    removeFromWishlist: wishlist.removeFromWishlist,

    // ---- Reviews ----
    getProductReviews: reviewsDomain.getProductReviews,
    getReviewSummary: reviewsDomain.getReviewSummary,
    submitReview: reviewsDomain.submitReview,

    // ---- Promotions ----
    getActivePromotions: promotionsDomain.getActivePromotions,
    validateCoupon: promotionsDomain.validateCoupon,

    // ---- Returns ----
    createReturn: returnsDomain.createReturn,
    getReturn: returnsDomain.getReturn,
    getReturns: returnsDomain.getReturns,
    getOrderReturns: returnsDomain.getOrderReturns,
    cancelReturn: returnsDomain.cancelReturn,

    // ---- NOT_SUPPORTED domains ----
    ...wholesaleStubs,
    ...auctionStubs,
    ...rentalStubs,
    ...giftCardStubs,
    ...locationStubs,
  } as CommerceAdapter

  return { adapter, admin }
}
