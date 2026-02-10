// ---------------------------------------------------------------------------
// SallaAdapter — maps Salla Merchant API v2 → CommerceAdapter contract
// ---------------------------------------------------------------------------

import {
  CommerceError,
  type CommerceAdapter,
  type AdapterDomain,
  type Product,
  type Category,
  type Cart,
  type Order,
  type Customer,
  type Wishlist,
  type StoreInfo,
  type SearchResult,
  type SearchParams,
  type GetProductParams,
  type GetCategoriesParams,
  type AddToCartInput,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
  type OrderStatusInfo,
  type OrderHistoryEntry,
  type Address,
  type ShippingMethod,
  type PaymentMethod,
  type PaginatedResult,
  type PaginationParams,
  type RegisterInput,
  type UpdateCustomerInput,
  type Review,
  type ReviewInput,
  type ReviewSummary,
  type Promotion,
  type Coupon,
  type ReturnRequest,
  type CreateReturnInput,
  type CustomerGroup,
  type QuoteRequest,
  type CreateQuoteInput,
  type Bid,
  type PlaceBidInput,
  type RentalBooking,
  type CreateRentalBookingInput,
  type AvailabilitySlot,
  type GiftCard,
  type GiftCardTransaction,
  type PurchaseGiftCardInput,
  type RedeemGiftCardInput,
  type Brand,
  type Country,
  type StoreLocation,
} from '@commercejs/types'

import { SallaClient } from './client.js'
import type {
  SallaConfig,
  SallaRawProduct,
  SallaRawCategory,
  SallaRawCustomer,
  SallaRawOrder,
  SallaRawOrderStatus,
  SallaRawOrderHistory,
  SallaRawReview,
  SallaRawShippingCompany,
  SallaRawPaymentMethod,
  SallaRawCoupon,
  SallaRawStoreInfo,
  SallaRawCurrency,
  SallaRawBrand,
  SallaRawCountry,
  SallaRawBranch,
} from './types.js'
import {
  mapSallaProduct,
  mapSallaCategory,
  mapSallaCustomer,
  mapSallaOrder,
  mapSallaOrderStatus,
  mapSallaOrderHistory,
  mapSallaReview,
  mapSallaShipping,
  mapSallaPayment,
  mapSallaBrand,
  mapSallaCountry,
  mapSallaBranch,
} from './mappers/index.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function notImplemented(method: string): never {
  throw new CommerceError(
    `SallaAdapter.${method}() is not supported by the Salla platform`,
    'NOT_SUPPORTED',
    501,
  )
}

function toLocalized(value: string, locale: string = 'ar') {
  if (locale === 'en') return { ar: '', en: value }
  return { ar: value, en: '' }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class SallaAdapter implements CommerceAdapter {
  readonly name = 'salla' as const
  private readonly client: SallaClient
  private readonly locale: string

  /**
   * Domains this adapter actually supports (methods won't throw NOT_SUPPORTED).
   * Used by consumers to check capability before calling.
   */
  readonly capabilities: AdapterDomain[] = [
    'catalog',
    'orders',
    'store',
    'promotions',
    'reviews',
    'brands',
    'countries',
    'locations',
    'customers', // partial: register + read via API
  ]

  constructor(config: SallaConfig) {
    this.client = new SallaClient(config)
    this.locale = config.locale ?? 'ar'
  }

  // ========================================================================
  // CatalogAdapter
  // ========================================================================

  async getProduct(params: GetProductParams): Promise<Product> {
    const id = params.id ?? params.slug
    if (!id) throw new CommerceError('Product ID or slug is required', 'VALIDATION', 422)

    const res = await this.client.get<SallaRawProduct>(`/products/${id}`)
    return mapSallaProduct(res.data, this.locale)
  }

  async getProducts(params: SearchParams): Promise<SearchResult> {
    const query: Record<string, unknown> = {}
    if (params.query) query.keyword = params.query
    if (params.categoryId) query.category_id = params.categoryId
    if (params.page) query.page = params.page
    if (params.perPage) query.per_page = params.perPage
    if (params.sort) {
      query.sort_by = params.sort.field
      query.sort_order = params.sort.direction
    }

    const paginated = await this.client.paginated<SallaRawProduct>('/products', query)

    return {
      products: {
        items: paginated.data.map((p) => mapSallaProduct(p, this.locale)),
        total: paginated.total,
        page: paginated.page,
        perPage: paginated.perPage,
        hasMore: paginated.page < paginated.totalPages,
      },
      facets: [],
      suggestions: null,
    }
  }

  async getCategories(params?: GetCategoriesParams): Promise<Category[]> {
    const query: Record<string, unknown> = {}
    if (params?.parentId) query.parent_id = params.parentId

    const res = await this.client.get<SallaRawCategory[]>('/categories', query)
    return res.data.map((c) => mapSallaCategory(c, this.locale))
  }

  // ========================================================================
  // CartAdapter — NOT SUPPORTED (Salla has no storefront cart REST API)
  // ========================================================================

  async createCart(): Promise<Cart> { return notImplemented('createCart') }
  async getCart(_cartId: string): Promise<Cart> { return notImplemented('getCart') }
  async addToCart(_cartId: string, _item: AddToCartInput): Promise<Cart> { return notImplemented('addToCart') }
  async updateCartItem(_cartId: string, _itemId: string, _quantity: number): Promise<Cart> { return notImplemented('updateCartItem') }
  async removeFromCart(_cartId: string, _itemId: string): Promise<Cart> { return notImplemented('removeFromCart') }
  async applyCoupon(_cartId: string, _code: string): Promise<Cart> { return notImplemented('applyCoupon') }
  async removeCoupon(_cartId: string): Promise<Cart> { return notImplemented('removeCoupon') }

  // ========================================================================
  // CheckoutAdapter
  // ========================================================================

  async getShippingMethods(_cartId: string): Promise<ShippingMethod[]> {
    try {
      const res = await this.client.get<SallaRawShippingCompany[]>('/shipping/companies')
      return res.data.map((s) => mapSallaShipping(s, this.locale))
    } catch {
      // shipping scope may not be granted — return empty
      return []
    }
  }

  async setShippingAddress(_cartId: string, _address: Omit<Address, 'id' | 'isDefault'>): Promise<Cart> {
    return notImplemented('setShippingAddress')
  }

  async setBillingAddress(_cartId: string, _address: Omit<Address, 'id' | 'isDefault'>): Promise<Cart> {
    return notImplemented('setBillingAddress')
  }

  async setShippingMethod(_cartId: string, _methodId: string): Promise<Cart> {
    return notImplemented('setShippingMethod')
  }

  async getPaymentMethods(_cartId: string): Promise<PaymentMethod[]> {
    const res = await this.client.get<SallaRawPaymentMethod[]>('/payment/methods')
    return res.data.map((p) => mapSallaPayment(p, this.locale))
  }

  async setPaymentMethod(_cartId: string, _methodId: string): Promise<Cart> {
    return notImplemented('setPaymentMethod')
  }

  async placeOrder(_cartId: string): Promise<Order> {
    return notImplemented('placeOrder')
  }

  // ========================================================================
  // CustomerAdapter
  // ========================================================================

  async login(_email: string, _password: string): Promise<Customer> {
    // Salla Merchant API doesn't support customer login — auth is via OAuth
    return notImplemented('login')
  }

  async register(input: RegisterInput): Promise<Customer> {
    const res = await this.client.post<SallaRawCustomer>('/customers', {
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      mobile: input.phone,
    })
    return mapSallaCustomer(res.data)
  }

  async getCustomer(): Promise<Customer> {
    // Salla Merchant API doesn't have a "me" endpoint —
    // this requires a customer ID which we'd get from session context.
    // For now, throw until we have session management.
    return notImplemented('getCustomer')
  }

  async updateCustomer(input: UpdateCustomerInput): Promise<Customer> {
    // Requires customer ID from session context
    // When session management is added, this will use PUT /customers/{id}
    return notImplemented('updateCustomer')
  }

  async logout(): Promise<void> {
    // OAuth — token revocation handled externally
  }

  async forgotPassword(_email: string): Promise<void> {
    return notImplemented('forgotPassword')
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    return notImplemented('resetPassword')
  }

  async getAddresses(): Promise<Address[]> {
    // Requires customer ID from session context
    return notImplemented('getAddresses')
  }

  async addAddress(_address: Omit<Address, 'id'>): Promise<Address> {
    return notImplemented('addAddress')
  }

  async updateAddress(_addressId: string, _address: Partial<Omit<Address, 'id'>>): Promise<Address> {
    return notImplemented('updateAddress')
  }

  async deleteAddress(_addressId: string): Promise<void> {
    return notImplemented('deleteAddress')
  }

  // ========================================================================
  // OrderAdapter
  // ========================================================================

  async createOrder(input: CreateOrderInput): Promise<Order> {
    // Build Salla's POST /orders payload
    const body: Record<string, unknown> = {
      // Items
      items: input.items.map((item) => ({
        product_id: Number(item.productId),
        quantity: item.quantity,
        ...(item.variantId ? { variant_id: Number(item.variantId) } : {}),
        ...(item.notes ? { note: item.notes } : {}),
      })),

      // Shipping address
      shipping: {
        company_id: input.shippingMethodId ? Number(input.shippingMethodId) : undefined,
        address: {
          country: input.shippingAddress.country,
          city: input.shippingAddress.city,
          street: input.shippingAddress.street,
          ...(input.shippingAddress.street2 ? { block: input.shippingAddress.street2 } : {}),
          ...(input.shippingAddress.postalCode ? { postal_code: input.shippingAddress.postalCode } : {}),
        },
      },

      // Payment method
      ...(input.payment ? { payment_method: input.payment.methodId } : {}),

      // Note
      ...(input.note ? { note: input.note } : {}),
    }

    // Customer ID or receiver (guest)
    if (input.customerId) {
      body.customer_id = Number(input.customerId)
    } else if (input.receiver) {
      body.receiver = {
        name: `${input.receiver.firstName} ${input.receiver.lastName}`,
        email: input.receiver.email,
        ...(input.receiver.phone ? { phone: input.receiver.phone } : {}),
      }
    }

    // Coupon
    if (input.couponCode) {
      body.coupon = input.couponCode
    }

    const res = await this.client.post<SallaRawOrder>('/orders', body)
    return mapSallaOrder(res.data, this.locale)
  }

  async getCustomerOrders(params?: PaginationParams): Promise<PaginatedResult<Order>> {
    const paginated = await this.client.paginated<SallaRawOrder>('/orders', {
      page: params?.page,
      perPage: params?.perPage,
    })

    return {
      items: paginated.data.map((o) => mapSallaOrder(o, this.locale)),
      total: paginated.total,
      page: paginated.page,
      perPage: paginated.perPage,
      hasMore: paginated.page < paginated.totalPages,
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    const res = await this.client.get<SallaRawOrder>(`/orders/${orderId}`)
    return mapSallaOrder(res.data, this.locale)
  }

  async getOrderStatuses(): Promise<OrderStatusInfo[]> {
    const res = await this.client.get<SallaRawOrderStatus[]>('/orders/statuses')
    return res.data.map(mapSallaOrderStatus)
  }

  async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput): Promise<void> {
    await this.client.post(`/orders/${orderId}/status`, {
      slug: input.status,
      ...(input.note ? { note: input.note } : {}),
      ...(input.restoreItems !== undefined ? { restore_items: input.restoreItems } : {}),
    })
  }

  async cancelOrder(orderId: string, note?: string): Promise<void> {
    await this.updateOrderStatus(orderId, {
      status: 'canceled',
      note,
      restoreItems: true,
    })
  }

  async duplicateOrder(orderId: string): Promise<Order> {
    const res = await this.client.post<SallaRawOrder>('/orders/duplicate', {
      order_id: Number(orderId),
    })
    return mapSallaOrder(res.data, this.locale)
  }

  async getOrderHistory(orderId: string): Promise<OrderHistoryEntry[]> {
    const res = await this.client.get<SallaRawOrderHistory[]>('/orders/histories', {
      order_id: orderId,
    })
    return res.data.map((h) => mapSallaOrderHistory(h, orderId))
  }

  // ========================================================================
  // WishlistAdapter — NOT SUPPORTED
  // ========================================================================

  async getWishlist(): Promise<Wishlist> { return notImplemented('getWishlist') }
  async addToWishlist(_productId: string, _variantId?: string): Promise<Wishlist> { return notImplemented('addToWishlist') }
  async removeFromWishlist(_itemId: string): Promise<Wishlist> { return notImplemented('removeFromWishlist') }

  // ========================================================================
  // ReviewAdapter
  // ========================================================================

  async getProductReviews(productId: string, params?: PaginationParams): Promise<PaginatedResult<Review>> {
    // Salla reviews are store-wide at /reviews — we filter by product_id
    const paginated = await this.client.paginated<SallaRawReview>('/reviews', {
      page: params?.page,
      perPage: params?.perPage,
      product_id: productId,
    })

    return {
      items: paginated.data.map(mapSallaReview),
      total: paginated.total,
      page: paginated.page,
      perPage: paginated.perPage,
      hasMore: paginated.page < paginated.totalPages,
    }
  }

  async getReviewSummary(productId: string): Promise<ReviewSummary> {
    const all = await this.getProductReviews(productId, { page: 1, perPage: 100 })
    const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0]
    let totalRating = 0

    for (const review of all.items) {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating - 1]++
        totalRating += review.rating
      }
    }

    return {
      productId,
      averageRating: all.total > 0 ? totalRating / all.total : 0,
      totalCount: all.total,
      distribution,
    }
  }

  async submitReview(input: ReviewInput): Promise<Review> {
    // Salla may not support review submission via API — try anyway
    try {
      const res = await this.client.post<SallaRawReview>(`/products/${input.productId}/reviews`, {
        rating: input.rating,
        content: input.body ?? '',
      })
      return mapSallaReview(res.data)
    } catch {
      return notImplemented('submitReview')
    }
  }

  // ========================================================================
  // StoreAdapter
  // ========================================================================

  async getStoreInfo(): Promise<StoreInfo> {
    const [storeRes, currencyRes] = await Promise.all([
      this.client.get<SallaRawStoreInfo>('/store/info'),
      this.client.get<SallaRawCurrency[]>('/currencies'),
    ])

    const store = storeRes.data
    const currencies = currencyRes.data

    return {
      name: { ar: store.name, en: store.name },
      description: store.description ? { ar: store.description, en: store.description } : null,
      logo: store.logo ? { url: store.logo, alt: store.name } : null,
      currencies: currencies.map((c) => ({
        code: c.code,
        symbol: c.symbol,
        isDefault: c.is_default,
      })),
      locales: [
        { code: 'ar', name: 'العربية', direction: 'rtl' as const, isDefault: true },
        { code: 'en', name: 'English', direction: 'ltr' as const, isDefault: false },
      ],
      country: 'SA',
    }
  }

  // ========================================================================
  // PromotionAdapter
  // ========================================================================

  async getActivePromotions(): Promise<Promotion[]> {
    const res = await this.client.get<SallaRawCoupon[]>('/coupons')

    return res.data
      .filter((c) => c.status === 'active')
      .map((c): Promotion => ({
        id: String(c.id),
        name: toLocalized(c.code, this.locale),
        description: null,
        discountType: c.type === 'percentage' ? 'percentage' : 'fixed_amount',
        discountValue: c.amount,
        currency: c.type !== 'percentage' ? 'SAR' : null,
        maxDiscount: c.maximum_amount ? { amount: c.maximum_amount, currency: 'SAR', formatted: `${c.maximum_amount.toFixed(2)} SAR` } : null,
        target: 'order',
        conditions: {
          minPurchaseAmount: c.minimum_amount ? { amount: c.minimum_amount, currency: 'SAR', formatted: `${c.minimum_amount.toFixed(2)} SAR` } : null,
          minItemCount: null,
          productIds: null,
          categoryIds: null,
          firstOrderOnly: false,
        },
        startsAt: c.start_date ?? new Date().toISOString(),
        endsAt: c.expiry_date,
        isActive: true,
        requiresCoupon: true,
        usageLimitPerCustomer: null,
        usageLimitTotal: c.usage_limit,
      }))
  }

  async validateCoupon(code: string): Promise<Coupon> {
    const res = await this.client.get<SallaRawCoupon[]>('/coupons', { code })
    const coupon = res.data.find((c) => c.code.toLowerCase() === code.toLowerCase())

    if (!coupon) {
      throw new CommerceError(`Coupon "${code}" not found`, 'VALIDATION', 404)
    }

    const promotion: Promotion = {
      id: String(coupon.id),
      name: toLocalized(coupon.code, this.locale),
      description: null,
      discountType: coupon.type === 'percentage' ? 'percentage' : 'fixed_amount',
      discountValue: coupon.amount,
      currency: coupon.type !== 'percentage' ? 'SAR' : null,
      maxDiscount: coupon.maximum_amount ? { amount: coupon.maximum_amount, currency: 'SAR', formatted: `${coupon.maximum_amount.toFixed(2)} SAR` } : null,
      target: 'order',
      conditions: {
        minPurchaseAmount: coupon.minimum_amount ? { amount: coupon.minimum_amount, currency: 'SAR', formatted: `${coupon.minimum_amount.toFixed(2)} SAR` } : null,
        minItemCount: null,
        productIds: null,
        categoryIds: null,
        firstOrderOnly: false,
      },
      startsAt: coupon.start_date ?? new Date().toISOString(),
      endsAt: coupon.expiry_date,
      isActive: coupon.status === 'active',
      requiresCoupon: true,
      usageLimitPerCustomer: null,
      usageLimitTotal: coupon.usage_limit,
    }

    return {
      id: String(coupon.id),
      code: coupon.code,
      promotion,
      isValid: coupon.status === 'active',
      invalidReason: coupon.status !== 'active' ? coupon.status : null,
      timesUsed: coupon.usage_count,
    }
  }

  // ========================================================================
  // ReturnAdapter — NOT SUPPORTED
  // ========================================================================

  async createReturn(_input: CreateReturnInput): Promise<ReturnRequest> { return notImplemented('createReturn') }
  async getReturns(_params?: PaginationParams): Promise<PaginatedResult<ReturnRequest>> { return notImplemented('getReturns') }
  async getReturn(_returnId: string): Promise<ReturnRequest> { return notImplemented('getReturn') }
  async cancelReturn(_returnId: string): Promise<ReturnRequest> { return notImplemented('cancelReturn') }

  // ========================================================================
  // WholesaleAdapter — PARTIAL (customer groups only)
  // ========================================================================

  async getCustomerGroups(): Promise<CustomerGroup[]> {
    const res = await this.client.get<Array<{ id: number; name: string }>>('/customers/groups')
    return res.data.map((g): CustomerGroup => ({
      id: String(g.id),
      code: String(g.id),
      name: toLocalized(g.name, this.locale),
      isWholesale: false,
      defaultDiscount: 0,
      minimumOrderValue: null,
    }))
  }

  async createQuote(_input: CreateQuoteInput): Promise<QuoteRequest> { return notImplemented('createQuote') }
  async getQuotes(_params?: PaginationParams): Promise<PaginatedResult<QuoteRequest>> { return notImplemented('getQuotes') }
  async getQuote(_quoteId: string): Promise<QuoteRequest> { return notImplemented('getQuote') }
  async acceptQuote(_quoteId: string): Promise<QuoteRequest> { return notImplemented('acceptQuote') }
  async rejectQuote(_quoteId: string): Promise<QuoteRequest> { return notImplemented('rejectQuote') }

  // ========================================================================
  // AuctionAdapter — NOT SUPPORTED
  // ========================================================================

  async placeBid(_input: PlaceBidInput): Promise<Bid> { return notImplemented('placeBid') }
  async getBids(_productId: string, _params?: PaginationParams): Promise<PaginatedResult<Bid>> { return notImplemented('getBids') }
  async getWinningBid(_productId: string): Promise<Bid | null> { return notImplemented('getWinningBid') }

  // ========================================================================
  // RentalAdapter — NOT SUPPORTED
  // ========================================================================

  async checkAvailability(_productId: string, _startDate: string, _endDate: string): Promise<AvailabilitySlot[]> { return notImplemented('checkAvailability') }
  async createBooking(_input: CreateRentalBookingInput): Promise<RentalBooking> { return notImplemented('createBooking') }
  async getBookings(_params?: PaginationParams): Promise<PaginatedResult<RentalBooking>> { return notImplemented('getBookings') }
  async getBooking(_bookingId: string): Promise<RentalBooking> { return notImplemented('getBooking') }
  async cancelBooking(_bookingId: string): Promise<RentalBooking> { return notImplemented('cancelBooking') }

  // ========================================================================
  // GiftCardAdapter — NOT SUPPORTED
  // ========================================================================

  async purchaseGiftCard(_input: PurchaseGiftCardInput): Promise<GiftCard> { return notImplemented('purchaseGiftCard') }
  async getGiftCardBalance(_code: string): Promise<GiftCard> { return notImplemented('getGiftCardBalance') }
  async redeemGiftCard(_input: RedeemGiftCardInput): Promise<GiftCard> { return notImplemented('redeemGiftCard') }
  async getMyGiftCards(): Promise<GiftCard[]> { return notImplemented('getMyGiftCards') }
  async getGiftCardTransactions(_giftCardId: string): Promise<GiftCardTransaction[]> { return notImplemented('getGiftCardTransactions') }

  // ========================================================================
  // BrandAdapter
  // ========================================================================

  async getBrands(): Promise<Brand[]> {
    const res = await this.client.get<SallaRawBrand[]>('/brands')
    return res.data.map((b) => mapSallaBrand(b, this.locale))
  }

  // ========================================================================
  // CountryAdapter
  // ========================================================================

  async getCountries(): Promise<Country[]> {
    const res = await this.client.get<SallaRawCountry[]>('/countries')
    return res.data.map(mapSallaCountry)
  }

  // ========================================================================
  // LocationAdapter
  // ========================================================================

  async getStoreLocations(): Promise<StoreLocation[]> {
    const res = await this.client.get<SallaRawBranch[]>('/branches')
    return res.data.map((b) => mapSallaBranch(b, this.locale))
  }
}
