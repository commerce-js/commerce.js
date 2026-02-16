// ---------------------------------------------------------------------------
// MedusaAdapter — Medusa V2 Store API adapter for CommerceJS
// ---------------------------------------------------------------------------
// Implements the full CommerceAdapter contract. Supports:
//   catalog, cart, checkout, customers, orders, store, countries
// Unsupported domains throw CommerceError('NOT_SUPPORTED', 501).
// ---------------------------------------------------------------------------

import { CommerceError } from '@commercejs/types'
import type {
  CommerceAdapter,
  AdapterDomain,
  GetProductParams,
  SearchParams,
  GetCategoriesParams,
  AddToCartInput,
} from '@commercejs/types'
import type { Address, RegisterInput, UpdateCustomerInput } from '@commercejs/types'
import type { PaginationParams, PaginatedResult } from '@commercejs/types'
import type { Product, Category, Cart, Customer, Order } from '@commercejs/types'
import type { SearchResult } from '@commercejs/types'
import type { ShippingMethod, PaymentMethod } from '@commercejs/types'
import type { StoreInfo, Country, StoreLocation } from '@commercejs/types'
import type { Wishlist, Review, ReviewInput, ReviewSummary } from '@commercejs/types'
import type { Promotion, Coupon } from '@commercejs/types'
import type { ReturnRequest, CreateReturnInput } from '@commercejs/types'
import type { CustomerGroup, QuoteRequest, CreateQuoteInput } from '@commercejs/types'
import type { Bid, PlaceBidInput } from '@commercejs/types'
import type { RentalBooking, CreateRentalBookingInput, AvailabilitySlot } from '@commercejs/types'
import type { GiftCard, GiftCardTransaction, PurchaseGiftCardInput, RedeemGiftCardInput } from '@commercejs/types'
import type { Brand } from '@commercejs/types'
import type { CreateOrderInput } from '@commercejs/types'
import type { OrderStatusInfo, OrderHistoryEntry, UpdateOrderStatusInput } from '@commercejs/types'

import { MedusaClient } from './client.js'
import type { MedusaConfig, MedusaProduct, MedusaProductCategory, MedusaCart, MedusaCustomer, MedusaOrder, MedusaRegion, MedusaShippingOption } from './types.js'
import {
  mapMedusaProduct,
  mapMedusaCategory,
  mapMedusaCart,
  mapMedusaCustomer,
  mapMedusaOrder,
  mapMedusaRegionsToStoreInfo,
  mapMedusaRegionsToCountries,
  mapMedusaShippingOption,
} from './mappers/index.js'

// ---- Helpers ----

function notImplemented(method: string): never {
  throw new CommerceError(
    `MedusaAdapter.${method}() is not supported by the Medusa platform`,
    'NOT_SUPPORTED',
    501,
  )
}

// ---- Adapter ----

export class MedusaAdapter implements CommerceAdapter {
  readonly name = 'medusa'

  readonly capabilities: AdapterDomain[] = [
    'catalog',
    'cart',
    'checkout',
    'customers',
    'orders',
    'store',
    'countries',
  ]

  private readonly client: MedusaClient
  private readonly config: MedusaConfig
  /** Cached region currency for price formatting */
  private defaultCurrency = 'usd'

  constructor(config: MedusaConfig) {
    this.config = config
    this.client = new MedusaClient(config)
  }

  // =========================================================================
  // Catalog
  // =========================================================================

  async getProduct(params: GetProductParams): Promise<Product> {
    if (params.id) {
      const res = await this.client.get<{ product: MedusaProduct }>(`/products/${params.id}`, {
        fields: '+variants.calculated_price',
      })
      return mapMedusaProduct(res.product, this.defaultCurrency)
    }

    if (params.slug) {
      // Medusa uses 'handle' for slugs
      const res = await this.client.get<{ products: MedusaProduct[] }>('/products', {
        handle: params.slug,
        fields: '+variants.calculated_price',
        limit: 1,
      })
      if (!res.products?.length) {
        throw new CommerceError(`Product with slug "${params.slug}" not found`, 'NOT_FOUND', 404)
      }
      return mapMedusaProduct(res.products[0], this.defaultCurrency)
    }

    throw new CommerceError('Either id or slug must be provided', 'VALIDATION', 400)
  }

  async getProducts(params: SearchParams): Promise<SearchResult> {
    const query: Record<string, unknown> = {}
    if (params.query) query.q = params.query
    if (params.categoryId) query.category_id = [params.categoryId]
    if (params.sort) {
      query.order = `${params.sort.direction === 'desc' ? '-' : ''}${params.sort.field}`
    }

    const result = await this.client.paginated<MedusaProduct>(
      '/products',
      'products',
      { page: params.page, perPage: params.perPage, query: { ...query, fields: '+variants.calculated_price' } },
    )

    return {
      products: {
        items: result.data.map(p => mapMedusaProduct(p, this.defaultCurrency)),
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        hasMore: result.page * result.perPage < result.total,
      },
      facets: [],
      suggestions: null,
    }
  }

  async getCategories(params?: GetCategoriesParams): Promise<Category[]> {
    const query: Record<string, unknown> = {}
    if (params?.parentId) query.parent_category_id = params.parentId
    if (params?.depth) query.include_descendants_tree = true

    const res = await this.client.get<{ product_categories: MedusaProductCategory[] }>(
      '/product-categories',
      query,
    )
    return (res.product_categories ?? []).map(c => mapMedusaCategory(c))
  }

  // =========================================================================
  // Cart
  // =========================================================================

  async createCart(): Promise<Cart> {
    const body: Record<string, unknown> = {}
    if (this.config.defaultRegionId) {
      body.region_id = this.config.defaultRegionId
    }
    const res = await this.client.post<{ cart: MedusaCart }>('/carts', body)
    if (res.cart.currency_code) this.defaultCurrency = res.cart.currency_code
    return mapMedusaCart(res.cart)
  }

  async getCart(cartId: string): Promise<Cart> {
    const res = await this.client.get<{ cart: MedusaCart }>(`/carts/${cartId}`)
    if (res.cart.currency_code) this.defaultCurrency = res.cart.currency_code
    return mapMedusaCart(res.cart)
  }

  async addToCart(cartId: string, item: AddToCartInput): Promise<Cart> {
    if (!item.variantId) {
      throw new CommerceError(
        'Medusa requires a variant_id to add items to cart. Products in Medusa always have variants.',
        'VALIDATION',
        400,
      )
    }
    const res = await this.client.post<{ cart: MedusaCart }>(`/carts/${cartId}/line-items`, {
      variant_id: item.variantId,
      quantity: item.quantity,
    })
    return mapMedusaCart(res.cart)
  }

  async updateCartItem(cartId: string, itemId: string, quantity: number): Promise<Cart> {
    const res = await this.client.post<{ cart: MedusaCart }>(`/carts/${cartId}/line-items/${itemId}`, {
      quantity,
    })
    return mapMedusaCart(res.cart)
  }

  async removeFromCart(cartId: string, itemId: string): Promise<Cart> {
    const res = await this.client.del<{ cart: MedusaCart }>(`/carts/${cartId}/line-items/${itemId}`)
    return mapMedusaCart(res.cart)
  }

  async applyCoupon(cartId: string, code: string): Promise<Cart> {
    // Medusa V2 uses promotion codes via the promotions endpoint
    const res = await this.client.post<{ cart: MedusaCart }>(`/carts/${cartId}/promotions`, {
      code,
    })
    return mapMedusaCart(res.cart)
  }

  async removeCoupon(cartId: string): Promise<Cart> {
    // Medusa V2 doesn't have a direct "remove coupon" — refresh cart
    const res = await this.client.get<{ cart: MedusaCart }>(`/carts/${cartId}`)
    return mapMedusaCart(res.cart)
  }

  // =========================================================================
  // Checkout
  // =========================================================================

  async getShippingMethods(cartId: string): Promise<ShippingMethod[]> {
    const cart = await this.client.get<{ cart: MedusaCart }>(`/carts/${cartId}`)
    const currency = cart.cart.currency_code
    const res = await this.client.get<{ shipping_options: MedusaShippingOption[] }>(
      '/shipping-options',
      { cart_id: cartId },
    )
    return (res.shipping_options ?? [])
      .filter(o => !o.is_return)
      .map(o => mapMedusaShippingOption(o, currency))
  }

  async setShippingAddress(cartId: string, address: Omit<Address, 'id' | 'isDefault'>): Promise<Cart> {
    const res = await this.client.post<{ cart: MedusaCart }>(`/carts/${cartId}`, {
      shipping_address: {
        first_name: address.firstName,
        last_name: address.lastName,
        phone: address.phone,
        address_1: address.street,
        address_2: address.street2,
        city: address.city,
        province: address.state,
        country_code: address.country?.toLowerCase(),
        postal_code: address.postalCode,
      },
    })
    return mapMedusaCart(res.cart)
  }

  async setBillingAddress(cartId: string, address: Omit<Address, 'id' | 'isDefault'>): Promise<Cart> {
    const res = await this.client.post<{ cart: MedusaCart }>(`/carts/${cartId}`, {
      billing_address: {
        first_name: address.firstName,
        last_name: address.lastName,
        phone: address.phone,
        address_1: address.street,
        address_2: address.street2,
        city: address.city,
        province: address.state,
        country_code: address.country?.toLowerCase(),
        postal_code: address.postalCode,
      },
    })
    return mapMedusaCart(res.cart)
  }

  async setShippingMethod(cartId: string, methodId: string): Promise<Cart> {
    const res = await this.client.post<{ cart: MedusaCart }>(`/carts/${cartId}/shipping-methods`, {
      option_id: methodId,
    })
    return mapMedusaCart(res.cart)
  }

  async getPaymentMethods(_cartId: string): Promise<PaymentMethod[]> {
    // Medusa V2 payment is handled via payment collections + sessions
    // Return empty — payment is managed via payment session initialization
    return []
  }

  async setPaymentMethod(cartId: string, methodId: string): Promise<Cart> {
    // Initialize a payment session for the given provider
    const res = await this.client.post<{ cart: MedusaCart }>(`/carts/${cartId}/payment-sessions`, {
      provider_id: methodId,
    })
    return mapMedusaCart(res.cart)
  }

  async placeOrder(cartId: string): Promise<Order> {
    const res = await this.client.post<{ order: MedusaOrder }>(`/carts/${cartId}/complete`)
    return mapMedusaOrder(res.order)
  }

  // =========================================================================
  // Customer
  // =========================================================================

  async login(email: string, password: string): Promise<Customer> {
    // Medusa V2 auth: POST /auth/customer/emailpass
    const authRes = await this.client.authPost<{ token: string }>('/auth/customer/emailpass', {
      email,
      password,
    })
    this.client.setToken(authRes.token)

    // Fetch customer profile
    const res = await this.client.get<{ customer: MedusaCustomer }>('/customers/me')
    return mapMedusaCustomer(res.customer)
  }

  async register(input: RegisterInput): Promise<Customer> {
    // Step 1: Create auth identity
    const authRes = await this.client.authPost<{ token: string }>('/auth/customer/emailpass/register', {
      email: input.email,
      password: input.password,
    })
    this.client.setToken(authRes.token)

    // Step 2: Create customer record
    const res = await this.client.post<{ customer: MedusaCustomer }>('/customers', {
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
    })
    return mapMedusaCustomer(res.customer)
  }

  async getCustomer(): Promise<Customer> {
    const res = await this.client.get<{ customer: MedusaCustomer }>('/customers/me')
    return mapMedusaCustomer(res.customer)
  }

  async updateCustomer(input: UpdateCustomerInput): Promise<Customer> {
    const body: Record<string, unknown> = {}
    if (input.email) body.email = input.email
    if (input.firstName) body.first_name = input.firstName
    if (input.lastName) body.last_name = input.lastName
    if (input.phone) body.phone = input.phone

    const res = await this.client.post<{ customer: MedusaCustomer }>('/customers/me', body)
    return mapMedusaCustomer(res.customer)
  }

  async logout(): Promise<void> {
    try {
      await this.client.authDelete('/auth/session')
    } catch {
      // Ignore errors — just clear the token
    }
    this.client.clearToken()
  }

  async forgotPassword(email: string): Promise<void> {
    await this.client.authPost('/auth/customer/emailpass/reset-password', { identifier: email })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.client.authPost('/auth/customer/emailpass/update', {
      token,
      password: newPassword,
    })
  }

  async getAddresses(): Promise<Address[]> {
    const res = await this.client.get<{ addresses: Address[] }>('/customers/me/addresses')
    return res.addresses ?? []
  }

  async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    const res = await this.client.post<{ address: Address }>('/customers/me/addresses', {
      first_name: address.firstName,
      last_name: address.lastName,
      phone: address.phone,
      address_1: address.street,
      address_2: address.street2,
      city: address.city,
      province: address.state,
      country_code: address.country?.toLowerCase(),
      postal_code: address.postalCode,
      is_default_shipping: address.isDefault,
    })
    return res.address
  }

  async updateAddress(addressId: string, address: Partial<Omit<Address, 'id'>>): Promise<Address> {
    const body: Record<string, unknown> = {}
    if (address.firstName !== undefined) body.first_name = address.firstName
    if (address.lastName !== undefined) body.last_name = address.lastName
    if (address.phone !== undefined) body.phone = address.phone
    if (address.street !== undefined) body.address_1 = address.street
    if (address.street2 !== undefined) body.address_2 = address.street2
    if (address.city !== undefined) body.city = address.city
    if (address.state !== undefined) body.province = address.state
    if (address.country !== undefined) body.country_code = address.country?.toLowerCase()
    if (address.postalCode !== undefined) body.postal_code = address.postalCode

    const res = await this.client.post<{ address: Address }>(`/customers/me/addresses/${addressId}`, body)
    return res.address
  }

  async deleteAddress(addressId: string): Promise<void> {
    await this.client.del(`/customers/me/addresses/${addressId}`)
  }

  // =========================================================================
  // Orders
  // =========================================================================

  async createOrder(_input: CreateOrderInput): Promise<Order> {
    // Medusa creates orders via cart completion (placeOrder)
    // Direct order creation is an admin-only operation
    return notImplemented('createOrder')
  }

  async getOrder(orderId: string): Promise<Order> {
    const res = await this.client.get<{ order: MedusaOrder }>(`/orders/${orderId}`)
    return mapMedusaOrder(res.order)
  }

  async getCustomerOrders(params?: PaginationParams): Promise<PaginatedResult<Order>> {
    const result = await this.client.paginated<MedusaOrder>(
      '/orders',
      'orders',
      { page: params?.page, perPage: params?.perPage },
    )
    return {
      items: result.data.map(o => mapMedusaOrder(o)),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      hasMore: result.page * result.perPage < result.total,
    }
  }

  async getOrderStatuses(): Promise<OrderStatusInfo[]> {
    return notImplemented('getOrderStatuses')
  }

  async updateOrderStatus(_orderId: string, _input: UpdateOrderStatusInput): Promise<void> {
    return notImplemented('updateOrderStatus')
  }

  async cancelOrder(_orderId: string, _note?: string): Promise<void> {
    return notImplemented('cancelOrder')
  }

  async duplicateOrder(_orderId: string): Promise<Order> {
    return notImplemented('duplicateOrder')
  }

  async getOrderHistory(_orderId: string): Promise<OrderHistoryEntry[]> {
    return notImplemented('getOrderHistory')
  }

  // =========================================================================
  // Store
  // =========================================================================

  async getStoreInfo(): Promise<StoreInfo> {
    const res = await this.client.get<{ regions: MedusaRegion[] }>('/regions')
    const regions = res.regions ?? []
    if (regions.length > 0 && regions[0].currency_code) {
      this.defaultCurrency = regions[0].currency_code
    }
    return mapMedusaRegionsToStoreInfo(regions)
  }

  // =========================================================================
  // Countries (derived from regions)
  // =========================================================================

  async getCountries(): Promise<Country[]> {
    const res = await this.client.get<{ regions: MedusaRegion[] }>('/regions')
    return mapMedusaRegionsToCountries(res.regions ?? [])
  }

  // =========================================================================
  // Unsupported Domains
  // =========================================================================

  // -- Wishlist --
  async getWishlist(): Promise<Wishlist> { return notImplemented('getWishlist') }
  async addToWishlist(_productId: string, _variantId?: string): Promise<Wishlist> { return notImplemented('addToWishlist') }
  async removeFromWishlist(_itemId: string): Promise<Wishlist> { return notImplemented('removeFromWishlist') }

  // -- Reviews --
  async getProductReviews(_productId: string, _params?: PaginationParams): Promise<PaginatedResult<Review>> { return notImplemented('getProductReviews') }
  async getReviewSummary(_productId: string): Promise<ReviewSummary> { return notImplemented('getReviewSummary') }
  async submitReview(_input: ReviewInput): Promise<Review> { return notImplemented('submitReview') }

  // -- Promotions --
  async getActivePromotions(): Promise<Promotion[]> { return notImplemented('getActivePromotions') }
  async validateCoupon(_code: string): Promise<Coupon> { return notImplemented('validateCoupon') }

  // -- Returns --
  async createReturn(_input: CreateReturnInput): Promise<ReturnRequest> { return notImplemented('createReturn') }
  async getReturns(_params?: PaginationParams): Promise<PaginatedResult<ReturnRequest>> { return notImplemented('getReturns') }
  async getReturn(_returnId: string): Promise<ReturnRequest> { return notImplemented('getReturn') }
  async cancelReturn(_returnId: string): Promise<ReturnRequest> { return notImplemented('cancelReturn') }

  // -- Wholesale --
  async getCustomerGroups(): Promise<CustomerGroup[]> { return notImplemented('getCustomerGroups') }
  async createQuote(_input: CreateQuoteInput): Promise<QuoteRequest> { return notImplemented('createQuote') }
  async getQuotes(_params?: PaginationParams): Promise<PaginatedResult<QuoteRequest>> { return notImplemented('getQuotes') }
  async getQuote(_quoteId: string): Promise<QuoteRequest> { return notImplemented('getQuote') }
  async acceptQuote(_quoteId: string): Promise<QuoteRequest> { return notImplemented('acceptQuote') }
  async rejectQuote(_quoteId: string): Promise<QuoteRequest> { return notImplemented('rejectQuote') }

  // -- Auctions --
  async placeBid(_input: PlaceBidInput): Promise<Bid> { return notImplemented('placeBid') }
  async getBids(_productId: string, _params?: PaginationParams): Promise<PaginatedResult<Bid>> { return notImplemented('getBids') }
  async getWinningBid(_productId: string): Promise<Bid | null> { return notImplemented('getWinningBid') }

  // -- Rentals --
  async checkAvailability(_productId: string, _startDate: string, _endDate: string): Promise<AvailabilitySlot[]> { return notImplemented('checkAvailability') }
  async createBooking(_input: CreateRentalBookingInput): Promise<RentalBooking> { return notImplemented('createBooking') }
  async getBookings(_params?: PaginationParams): Promise<PaginatedResult<RentalBooking>> { return notImplemented('getBookings') }
  async getBooking(_bookingId: string): Promise<RentalBooking> { return notImplemented('getBooking') }
  async cancelBooking(_bookingId: string): Promise<RentalBooking> { return notImplemented('cancelBooking') }

  // -- Gift Cards --
  async purchaseGiftCard(_input: PurchaseGiftCardInput): Promise<GiftCard> { return notImplemented('purchaseGiftCard') }
  async getGiftCardBalance(_code: string): Promise<GiftCard> { return notImplemented('getGiftCardBalance') }
  async redeemGiftCard(_input: RedeemGiftCardInput): Promise<GiftCard> { return notImplemented('redeemGiftCard') }
  async getMyGiftCards(): Promise<GiftCard[]> { return notImplemented('getMyGiftCards') }
  async getGiftCardTransactions(_giftCardId: string): Promise<GiftCardTransaction[]> { return notImplemented('getGiftCardTransactions') }

  // -- Brands --
  async getBrands(): Promise<Brand[]> { return notImplemented('getBrands') }

  // -- Locations --
  async getStoreLocations(): Promise<StoreLocation[]> { return notImplemented('getStoreLocations') }
}
