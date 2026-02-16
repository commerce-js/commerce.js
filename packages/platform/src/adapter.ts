// ---------------------------------------------------------------------------
// PlatformAdapter — native commerce engine implementing CommerceAdapter
// ---------------------------------------------------------------------------

import type { CommerceAdapter, AdapterDomain } from '@commercejs/types'
import type { PlatformConfig, DatabaseDriver } from './types.js'
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
 * Detect the database driver from configuration or environment.
 *
 * Priority:
 * 1. Explicit `config.driver` value
 * 2. `DATABASE_URL` env var — if starts with `postgres://` or `postgresql://`, use Neon
 * 3. Default to SQLite
 */
function detectDriver(config: PlatformConfig): DatabaseDriver {
  if (config.driver) return config.driver

  const dbUrl = config.connectionString ?? globalThis.process?.env?.DATABASE_URL ?? ''
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    return 'neon'
  }
  return 'sqlite'
}

/**
 * Initialize the database based on the detected driver.
 *
 * This auto-initializes the correct Prisma client so consumers
 * don't need to call `initPrisma()` / `initPrismaNeon()` manually.
 *
 * If the database is already initialized (e.g. via explicit `initPrisma()`
 * call in test setup), this is a no-op.
 */
async function initDatabase(driver: DatabaseDriver, connectionString?: string) {
  // Check if already initialized — don't stomp on existing setup
  try {
    const { getDb } = await import('./database/prisma/client.js')
    getDb() // Throws if not initialized
    return // Already initialized — skip
  } catch {
    // Not initialized yet — continue
  }

  if (driver === 'neon') {
    const { initPrismaNeon } = await import('./database/neon/client.js')
    if (!connectionString) {
      connectionString = globalThis.process?.env?.DATABASE_URL
    }
    if (!connectionString) {
      throw new Error(
        'Neon driver requires a connection string. Pass `connectionString` in config or set DATABASE_URL env var.',
      )
    }
    return initPrismaNeon(connectionString)
  }

  // Default: SQLite
  const { initPrisma } = await import('./database/prisma/client.js')
  return initPrisma(connectionString ?? ':memory:')
}

/**
 * Create a PlatformAdapter — the native CommerceJS commerce engine.
 *
 * Supports automatic driver detection:
 *
 * @example Auto-detect (recommended)
 * ```ts
 * // Uses DATABASE_URL env var to pick sqlite or neon
 * const adapter = await createPlatformAdapter({ currency: 'SAR' })
 * ```
 *
 * @example Explicit Neon (cloud)
 * ```ts
 * const adapter = await createPlatformAdapter({
 *   driver: 'neon',
 *   connectionString: process.env.DATABASE_URL,
 * })
 * ```
 *
 * @example Explicit SQLite (local dev)
 * ```ts
 * const adapter = await createPlatformAdapter({
 *   driver: 'sqlite',
 *   connectionString: './store.db',
 * })
 * ```
 */
export async function createPlatformAdapter(config: PlatformConfig = {}): Promise<CommerceAdapter> {
  const currency = config.currency ?? 'SAR'
  const driver = detectDriver(config)

  // Auto-initialize the database
  await initDatabase(driver, config.connectionString)

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

  return {
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
}
