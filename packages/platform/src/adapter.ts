// ---------------------------------------------------------------------------
// PlatformAdapter — native commerce engine implementing CommerceAdapter
// ---------------------------------------------------------------------------

import type { CommerceAdapter, AdapterDomain } from '@commercejs/types'
import type { PlatformConfig } from './types.js'
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
 * Create a PlatformAdapter — the native CommerceJS commerce engine.
 *
 * Before calling this, initialize the database driver:
 *
 * @example Drizzle (default — used for development/testing)
 * ```ts
 * import { initDrizzle, migrateDrizzle } from '@commercejs/platform/drizzle'
 * import { createPlatformAdapter } from '@commercejs/platform'
 *
 * const db = initDrizzle('./store.db')
 * migrateDrizzle(db)
 *
 * const adapter = createPlatformAdapter({ currency: 'SAR' })
 * ```
 */
export function createPlatformAdapter(config: PlatformConfig = {}): CommerceAdapter {
  const currency = config.currency ?? 'SAR'

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
