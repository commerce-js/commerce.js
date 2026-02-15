// ---------------------------------------------------------------------------
// Adapter contract — the interface every platform adapter must implement
// ---------------------------------------------------------------------------
// Split into domain-specific sub-interfaces (Design Pattern: Interface
// Segregation) so adapters can implement only the domains they support.
//
// The CommerceAdapter type composes all sub-interfaces. For composable
// setups, consumers can use individual sub-interfaces (CatalogAdapter,
// OrderAdapter, etc.) and the AdapterCapabilities system.
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
import type { CreateOrderInput } from './order-input.js'
import type { OrderStatusInfo, OrderHistoryEntry, UpdateOrderStatusInput } from './order-status.js'

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
 * Customer operations — authentication, profile, and address book.
 */
export interface CustomerAdapter<
  TCustomer extends Customer = Customer,
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
}

/**
 * Order operations — create, read, and list orders.
 *
 * Separated from CustomerAdapter so that order creation can be handled
 * independently (e.g., by a checkout engine that pushes orders to the
 * platform after payment processing).
 */
export interface OrderAdapter<TOrder extends Order = Order> {
  /** Create a new order from structured input (e.g., after checkout) */
  createOrder(input: CreateOrderInput): Promise<TOrder>

  /** Get a single order by ID */
  getOrder(orderId: string): Promise<TOrder>

  /** Get paginated list of orders (optionally filtered by customer) */
  getCustomerOrders(params?: PaginationParams): Promise<PaginatedResult<TOrder>>

  /** Get all available order statuses (with labels, colors, icons) */
  getOrderStatuses(): Promise<OrderStatusInfo[]>

  /** Update an order's status */
  updateOrderStatus(orderId: string, input: UpdateOrderStatusInput): Promise<void>

  /** Cancel an order (convenience — calls updateOrderStatus with 'canceled') */
  cancelOrder(orderId: string, note?: string): Promise<void>

  /** Duplicate an existing order (reorder) */
  duplicateOrder(orderId: string): Promise<TOrder>

  /** Get order status change history / timeline */
  getOrderHistory(orderId: string): Promise<OrderHistoryEntry[]>
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

// ---- Adapter Capabilities ----

/** Well-known capability domain names */
export type AdapterDomain =
  | 'catalog'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'customers'
  | 'wishlist'
  | 'reviews'
  | 'store'
  | 'promotions'
  | 'returns'
  | 'wholesale'
  | 'auctions'
  | 'rentals'
  | 'gift-cards'
  | 'brands'
  | 'countries'
  | 'locations'

// ---- Three-Tier Domain Model ----

/**
 * Tier 1: Universal domains — always present in every orchestrator.
 *
 * These are the minimum viable commerce operations: product catalog
 * and store metadata. Every adapter must provide these.
 */
export interface UniversalDomains<
  TProduct extends Product = Product,
  TCategory extends Category = Category,
  TSearchResult extends SearchResult = SearchResult,
  TStoreInfo extends StoreInfo = StoreInfo,
> extends CatalogAdapter<TProduct, TCategory, TSearchResult>, StoreAdapter<TStoreInfo> {}

/**
 * Tier 2: Common domains — present in most commerce platforms.
 *
 * These are optional sub-interfaces that adapters may or may not support.
 * Use `orchestrator.supports('cart')` to check at runtime, or access
 * via `orchestrator.domain('cart')` which throws if unsupported.
 */
export interface CommonDomains<
  TCart extends Cart = Cart,
  TOrder extends Order = Order,
  TCustomer extends Customer = Customer,
  TWishlist extends Wishlist = Wishlist,
> {
  cart?: CartAdapter<TCart>
  checkout?: CheckoutAdapter<TCart, TOrder>
  orders?: OrderAdapter<TOrder>
  customers?: CustomerAdapter<TCustomer>
  wishlist?: WishlistAdapter<TWishlist>
  reviews?: ReviewAdapter
  promotions?: PromotionAdapter
  brands?: BrandAdapter
  countries?: CountryAdapter
  locations?: LocationAdapter
}

/**
 * Tier 3: Specialized domains — niche features.
 *
 * Only present in specific platforms or custom implementations.
 */
export interface SpecializedDomains {
  returns?: ReturnAdapter
  wholesale?: WholesaleAdapter
  auctions?: AuctionAdapter
  rentals?: RentalAdapter
  giftCards?: GiftCardAdapter
}

/** Union of all optional domain keys (Tier 2 + Tier 3) */
export type OrchestratorDomain = keyof CommonDomains & keyof SpecializedDomains extends never
  ? keyof CommonDomains | keyof SpecializedDomains
  : keyof CommonDomains | keyof SpecializedDomains

/** Map from domain key to its adapter interface */
export type DomainMap<
  TCart extends Cart = Cart,
  TOrder extends Order = Order,
  TCustomer extends Customer = Customer,
  TWishlist extends Wishlist = Wishlist,
> = CommonDomains<TCart, TOrder, TCustomer, TWishlist> & SpecializedDomains

/**
 * CommerceOrchestrator — the evolution of CommerceAdapter.
 *
 * Unlike `CommerceAdapter` which requires all 16 sub-interfaces,
 * the orchestrator has only `CatalogAdapter` and `StoreAdapter` as
 * required (Tier 1). All other domains live in `domains` and are
 * accessed via the `supports()` type guard or `domain()` accessor.
 *
 * @example
 * ```ts
 * const orch = createCompositeOrchestrator({ ... })
 *
 * // Type-safe domain access with narrowing
 * if (orch.supports('cart')) {
 *   const cart = await orch.domain('cart').createCart()
 * }
 *
 * // Or direct access (throws if unsupported)
 * const cart = await orch.domain('cart').createCart()
 * ```
 */
export interface CommerceOrchestrator<
  TProduct extends Product = Product,
  TCategory extends Category = Category,
  TSearchResult extends SearchResult = SearchResult,
  TCart extends Cart = Cart,
  TOrder extends Order = Order,
  TCustomer extends Customer = Customer,
  TWishlist extends Wishlist = Wishlist,
  TStoreInfo extends StoreInfo = StoreInfo,
> extends UniversalDomains<TProduct, TCategory, TSearchResult, TStoreInfo> {
  /** Unique orchestrator/adapter identifier */
  readonly name: string

  /** All registered optional domains */
  readonly domains: Partial<DomainMap<TCart, TOrder, TCustomer, TWishlist>>

  /**
   * Check whether a domain is available at runtime.
   *
   * @example
   * ```ts
   * if (orch.supports('cart')) {
   *   // TypeScript knows orch.domains.cart is defined
   *   const cart = await orch.domain('cart').createCart()
   * }
   * ```
   */
  supports<D extends keyof DomainMap>(domain: D): boolean

  /**
   * Get a domain adapter. Throws `CommerceError` with code 'NOT_SUPPORTED'
   * if the domain is not available.
   *
   * @throws {CommerceError} with code 'NOT_SUPPORTED' if domain is missing
   */
  domain<D extends keyof DomainMap<TCart, TOrder, TCustomer, TWishlist>>(
    domain: D,
  ): NonNullable<DomainMap<TCart, TOrder, TCustomer, TWishlist>[D]>

  /** Legacy compatibility — list of supported domain names */
  readonly capabilities: AdapterDomain[]
}

// ---- Composed Adapter ----

/**
 * CommerceAdapter — the full contract that platform adapters implement.
 *
 * Composed from domain-specific sub-interfaces. Each adapter (Salla, Zid,
 * Shopify, Medusa, etc.) provides its own implementation, mapping
 * platform-specific API calls and data shapes to the unified types.
 *
 * Adapters MUST implement all sub-interfaces but MAY throw a
 * `CommerceError` with code 'NOT_SUPPORTED' (status 501) for domains
 * the platform doesn't support. Use `capabilities` to check support
 * at runtime before calling.
 *
 * Generic type parameters allow adapters to expose enriched, platform-specific
 * types while remaining compatible with the base interface.
 *
 * @example
 * ```ts
 * // Check before calling optional domain
 * if (adapter.capabilities.includes('cart')) {
 *   const cart = await adapter.createCart()
 * }
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
  CustomerAdapter<TCustomer>,
  OrderAdapter<TOrder>,
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

  /**
   * Domains this adapter actually supports (i.e., won't throw NOT_SUPPORTED).
   *
   * Consumers should check this before calling methods in optional domains.
   * Required domains like 'catalog' and 'store' should always be listed.
   */
  readonly capabilities: AdapterDomain[]
}
