// ---------------------------------------------------------------------------
// Adapter contract — the interface every platform adapter must implement
// ---------------------------------------------------------------------------
// Split into domain-specific sub-interfaces (Design Pattern: Interface
// Segregation) so adapters can implement only the domains they support.
// ---------------------------------------------------------------------------

import type { PaginatedResult, PaginationParams } from './common.js'
import type { Product } from './product.js'
import type { Category } from './category.js'
import type { Cart } from './cart.js'
import type { Customer, Address, RegisterInput, UpdateCustomerInput } from './customer.js'
import type { Order } from './order.js'
import type { ShippingMethod } from './shipping.js'
import type { PaymentMethod } from './payment.js'
import type { SearchParams, SearchResult } from './search.js'
import type { Wishlist } from './wishlist.js'
import type { Review, ReviewInput, ReviewSummary } from './review.js'
import type { StoreInfo } from './store.js'
import type { Promotion, Coupon } from './promotion.js'
import type { ReturnRequest, CreateReturnInput } from './return.js'
import type { CustomerGroup, QuoteRequest, CreateQuoteInput } from './wholesale.js'
import type { Bid, PlaceBidInput } from './auction.js'
import type { RentalBooking, CreateRentalBookingInput, AvailabilitySlot } from './rental.js'
import type { GiftCard, GiftCardTransaction, PurchaseGiftCardInput, RedeemGiftCardInput } from './gift-card.js'
import type { Brand } from './brand.js'
import type { Country } from './country.js'
import type { StoreLocation } from './location.js'

// ---- Input types for adapter methods ----

export interface GetProductParams {
  id?: string
  slug?: string
}

export interface GetCategoriesParams {
  parentId?: string
  depth?: number
}

export interface AddToCartInput {
  productId: string
  variantId?: string
  quantity: number
}

// ---- Domain Sub-Interfaces ----

/**
 * Catalog operations — product and category retrieval.
 *
 * Generic type parameters allow adapters to return enriched types
 * (e.g., SallaProduct extends Product) while keeping the contract satisfied.
 */
export interface CatalogAdapter<
  TProduct extends Product = Product,
  TCategory extends Category = Category,
  TSearchResult extends SearchResult = SearchResult,
> {
  /** Fetch a single product by ID or slug */
  getProduct(params: GetProductParams): Promise<TProduct>

  /** Search / list products with filters and pagination */
  getProducts(params: SearchParams): Promise<TSearchResult>

  /** Fetch category tree */
  getCategories(params?: GetCategoriesParams): Promise<TCategory[]>
}

/**
 * Cart operations — CRUD for cart items.
 */
export interface CartAdapter<TCart extends Cart = Cart> {
  /** Create a new empty cart and return it */
  createCart(): Promise<TCart>

  /** Get an existing cart by ID */
  getCart(cartId: string): Promise<TCart>

  /** Add an item to the cart */
  addToCart(cartId: string, item: AddToCartInput): Promise<TCart>

  /** Update cart item quantity */
  updateCartItem(cartId: string, itemId: string, quantity: number): Promise<TCart>

  /** Remove an item from the cart */
  removeFromCart(cartId: string, itemId: string): Promise<TCart>

  /** Apply a coupon code to the cart */
  applyCoupon(cartId: string, code: string): Promise<TCart>

  /** Remove a coupon from the cart */
  removeCoupon(cartId: string): Promise<TCart>
}

/**
 * Checkout operations — shipping, payment, and order placement.
 */
export interface CheckoutAdapter<
  TCart extends Cart = Cart,
  TOrder extends Order = Order,
> {
  /** List available shipping methods for a cart */
  getShippingMethods(cartId: string): Promise<ShippingMethod[]>

  /** Set the shipping address */
  setShippingAddress(cartId: string, address: Omit<Address, 'id' | 'isDefault'>): Promise<TCart>

  /** Set the billing address */
  setBillingAddress(cartId: string, address: Omit<Address, 'id' | 'isDefault'>): Promise<TCart>

  /** Select a shipping method */
  setShippingMethod(cartId: string, methodId: string): Promise<TCart>

  /** List available payment methods for a cart */
  getPaymentMethods(cartId: string): Promise<PaymentMethod[]>

  /** Select a payment method */
  setPaymentMethod(cartId: string, methodId: string): Promise<TCart>

  /** Place the order (finalize checkout) */
  placeOrder(cartId: string): Promise<TOrder>
}

/**
 * Customer operations — authentication, profile, address book, and orders.
 */
export interface CustomerAdapter<
  TCustomer extends Customer = Customer,
  TOrder extends Order = Order,
> {
  /** Authenticate a customer */
  login(email: string, password: string): Promise<TCustomer>

  /** Register a new customer */
  register(input: RegisterInput): Promise<TCustomer>

  /** Get the currently authenticated customer */
  getCustomer(): Promise<TCustomer>

  /** Update customer profile */
  updateCustomer(input: UpdateCustomerInput): Promise<TCustomer>

  /** Logout the current customer */
  logout(): Promise<void>

  // ---- Password Reset ----

  /** Send a password reset email / OTP */
  forgotPassword(email: string): Promise<void>

  /** Reset password using a token/OTP received via email */
  resetPassword(token: string, newPassword: string): Promise<void>

  // ---- Address Book ----

  /** Get all saved addresses for the authenticated customer */
  getAddresses(): Promise<Address[]>

  /** Add a new address to the customer's address book */
  addAddress(address: Omit<Address, 'id'>): Promise<Address>

  /** Update an existing address */
  updateAddress(addressId: string, address: Partial<Omit<Address, 'id'>>): Promise<Address>

  /** Delete an address from the address book */
  deleteAddress(addressId: string): Promise<void>

  // ---- Customer Orders ----

  /** Get paginated list of customer orders */
  getCustomerOrders(params?: PaginationParams): Promise<PaginatedResult<TOrder>>

  /** Get a single order by ID */
  getOrder(orderId: string): Promise<TOrder>
}

/**
 * Wishlist operations — favorites / saved items.
 */
export interface WishlistAdapter<TWishlist extends Wishlist = Wishlist> {
  /** Get the authenticated customer's wishlist */
  getWishlist(): Promise<TWishlist>

  /** Add a product to the wishlist */
  addToWishlist(productId: string, variantId?: string): Promise<TWishlist>

  /** Remove an item from the wishlist */
  removeFromWishlist(itemId: string): Promise<TWishlist>
}

/**
 * Review operations — product ratings and reviews.
 */
export interface ReviewAdapter {
  /** Get paginated reviews for a product */
  getProductReviews(productId: string, params?: PaginationParams): Promise<PaginatedResult<Review>>

  /** Get review summary (average rating, distribution) for a product */
  getReviewSummary(productId: string): Promise<ReviewSummary>

  /** Submit a new review for a product */
  submitReview(input: ReviewInput): Promise<Review>
}

/**
 * Store operations — store-level metadata.
 */
export interface StoreAdapter<TStoreInfo extends StoreInfo = StoreInfo> {
  /** Get store information (name, logo, currencies, locales) */
  getStoreInfo(): Promise<TStoreInfo>
}

/**
 * Promotion operations — discounts and coupon validation.
 */
export interface PromotionAdapter {
  /** Get all currently active promotions */
  getActivePromotions(): Promise<Promotion[]>

  /** Validate a coupon code and return coupon details */
  validateCoupon(code: string): Promise<Coupon>
}

/**
 * Return operations — return requests and refunds.
 */
export interface ReturnAdapter {
  /** Create a return request for an order */
  createReturn(input: CreateReturnInput): Promise<ReturnRequest>

  /** Get paginated list of customer's return requests */
  getReturns(params?: PaginationParams): Promise<PaginatedResult<ReturnRequest>>

  /** Get a single return request by ID */
  getReturn(returnId: string): Promise<ReturnRequest>

  /** Cancel a return request (only if status is 'requested') */
  cancelReturn(returnId: string): Promise<ReturnRequest>
}

/**
 * Brand operations — product brand listing.
 */
export interface BrandAdapter {
  /** Get all product brands */
  getBrands(): Promise<Brand[]>
}

/**
 * Country operations — for address forms and locale resolution.
 */
export interface CountryAdapter {
  /** Get all countries supported by the store */
  getCountries(): Promise<Country[]>
}

/**
 * Location operations — store branches and pickup points.
 */
export interface LocationAdapter {
  /** Get all store locations / branches */
  getStoreLocations(): Promise<StoreLocation[]>
}

/**
 * Wholesale / B2B operations — customer groups, quotes, and bulk pricing.
 */
export interface WholesaleAdapter {
  /** Get all customer groups (wholesale, retail, VIP, etc.) */
  getCustomerGroups(): Promise<CustomerGroup[]>

  /** Create a request-for-quote */
  createQuote(input: CreateQuoteInput): Promise<QuoteRequest>

  /** Get paginated list of customer's quote requests */
  getQuotes(params?: PaginationParams): Promise<PaginatedResult<QuoteRequest>>

  /** Get a single quote by ID */
  getQuote(quoteId: string): Promise<QuoteRequest>

  /** Accept a quoted price (converts to order) */
  acceptQuote(quoteId: string): Promise<QuoteRequest>

  /** Reject a quote */
  rejectQuote(quoteId: string): Promise<QuoteRequest>
}

/**
 * Auction operations — bidding on products.
 */
export interface AuctionAdapter {
  /** Place a bid on an auction product */
  placeBid(input: PlaceBidInput): Promise<Bid>

  /** Get bid history for a product */
  getBids(productId: string, params?: PaginationParams): Promise<PaginatedResult<Bid>>

  /** Get the current winning bid for a product */
  getWinningBid(productId: string): Promise<Bid | null>
}

/**
 * Rental / booking operations.
 */
export interface RentalAdapter {
  /** Check availability for a product in a date range */
  checkAvailability(productId: string, startDate: string, endDate: string): Promise<AvailabilitySlot[]>

  /** Create a rental booking */
  createBooking(input: CreateRentalBookingInput): Promise<RentalBooking>

  /** Get customer's bookings */
  getBookings(params?: PaginationParams): Promise<PaginatedResult<RentalBooking>>

  /** Get a single booking by ID */
  getBooking(bookingId: string): Promise<RentalBooking>

  /** Cancel a booking */
  cancelBooking(bookingId: string): Promise<RentalBooking>
}

/**
 * Gift card operations.
 */
export interface GiftCardAdapter {
  /** Purchase a new gift card */
  purchaseGiftCard(input: PurchaseGiftCardInput): Promise<GiftCard>

  /** Check a gift card balance by code */
  getGiftCardBalance(code: string): Promise<GiftCard>

  /** Redeem a gift card at checkout (apply to cart) */
  redeemGiftCard(input: RedeemGiftCardInput): Promise<GiftCard>

  /** Get customer's gift cards */
  getMyGiftCards(): Promise<GiftCard[]>

  /** Get transaction history for a gift card */
  getGiftCardTransactions(giftCardId: string): Promise<GiftCardTransaction[]>
}

// ---- Composed Adapter ----

/**
 * CommerceAdapter — the full contract that all platform adapters must implement.
 *
 * Composed from domain-specific sub-interfaces. Each adapter (Salla, Zid,
 * Shopify, Medusa, etc.) provides its own implementation, mapping
 * platform-specific API calls and data shapes to the unified types.
 *
 * Generic type parameters allow adapters to expose enriched, platform-specific
 * types while remaining compatible with the base interface.
 *
 * @example
 * ```ts
 * // Adapter with default types
 * class GenericAdapter implements CommerceAdapter { ... }
 *
 * // Adapter with enriched types
 * class SallaAdapter implements CommerceAdapter<SallaProduct, SallaCategory> { ... }
 * ```
 */
export interface CommerceAdapter<
  TProduct extends Product = Product,
  TCategory extends Category = Category,
  TSearchResult extends SearchResult = SearchResult,
  TCart extends Cart = Cart,
  TOrder extends Order = Order,
  TCustomer extends Customer = Customer,
  TWishlist extends Wishlist = Wishlist,
  TStoreInfo extends StoreInfo = StoreInfo,
> extends
  CatalogAdapter<TProduct, TCategory, TSearchResult>,
  CartAdapter<TCart>,
  CheckoutAdapter<TCart, TOrder>,
  CustomerAdapter<TCustomer, TOrder>,
  WishlistAdapter<TWishlist>,
  ReviewAdapter,
  StoreAdapter<TStoreInfo>,
  PromotionAdapter,
  ReturnAdapter,
  WholesaleAdapter,
  AuctionAdapter,
  RentalAdapter,
  GiftCardAdapter,
  BrandAdapter,
  CountryAdapter,
  LocationAdapter
{
  /** Unique adapter identifier (e.g., "salla", "zid", "shopify") */
  readonly name: string
}
