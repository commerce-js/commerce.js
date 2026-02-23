import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCommerce } from '../commerce.js'
import { CommerceError } from '@commercejs/types'
import type { CommerceAdapter, PaymentProvider, PaymentSession, CreatePaymentSessionInput, RefundInput, DeliveryProvider, Delivery, DeliveryEstimate } from '@commercejs/types'

// ---- Mock Adapter ----

function createMockAdapter(overrides: Partial<CommerceAdapter> = {}): CommerceAdapter {
  return {
    name: 'mock',
    capabilities: ['catalog', 'cart', 'checkout', 'orders', 'customers', 'store'],
    getProduct: vi.fn().mockResolvedValue({ id: 'prod_1', name: 'Test Product' }),
    getProducts: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
    getCategories: vi.fn().mockResolvedValue([]),
    createCart: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    getCart: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    addToCart: vi.fn().mockResolvedValue({ id: 'cart_1', items: [{ id: 'item_1' }], totals: {} }),
    updateCartItem: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    removeFromCart: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    applyCoupon: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    removeCoupon: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    getShippingMethods: vi.fn().mockResolvedValue([]),
    setShippingAddress: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    setBillingAddress: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    setShippingMethod: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    getPaymentMethods: vi.fn().mockResolvedValue([]),
    setPaymentMethod: vi.fn().mockResolvedValue({ id: 'cart_1', items: [], totals: {} }),
    placeOrder: vi.fn().mockResolvedValue({ id: 'ord_1', status: 'pending' }),
    login: vi.fn().mockResolvedValue({ id: 'cust_1', email: 'test@example.com' }),
    register: vi.fn().mockResolvedValue({ id: 'cust_1', email: 'test@example.com' }),
    getCustomer: vi.fn().mockResolvedValue({ id: 'cust_1', email: 'test@example.com' }),
    updateCustomer: vi.fn().mockResolvedValue({ id: 'cust_1', email: 'test@example.com' }),
    logout: vi.fn().mockResolvedValue(undefined),
    forgotPassword: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    getAddresses: vi.fn().mockResolvedValue([]),
    addAddress: vi.fn().mockResolvedValue({ id: 'addr_1' }),
    updateAddress: vi.fn().mockResolvedValue({ id: 'addr_1' }),
    deleteAddress: vi.fn().mockResolvedValue(undefined),
    createOrder: vi.fn().mockResolvedValue({ id: 'ord_1' }),
    getOrder: vi.fn().mockResolvedValue({ id: 'ord_1' }),
    getCustomerOrders: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
    getOrderStatuses: vi.fn().mockResolvedValue([]),
    updateOrderStatus: vi.fn().mockResolvedValue(undefined),
    cancelOrder: vi.fn().mockResolvedValue(undefined),
    duplicateOrder: vi.fn().mockResolvedValue({ id: 'ord_2' }),
    getOrderHistory: vi.fn().mockResolvedValue([]),
    getWishlist: vi.fn().mockResolvedValue({ items: [] }),
    addToWishlist: vi.fn().mockResolvedValue({ items: [] }),
    removeFromWishlist: vi.fn().mockResolvedValue({ items: [] }),
    getProductReviews: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
    getReviewSummary: vi.fn().mockResolvedValue({ average: 0, count: 0 }),
    submitReview: vi.fn().mockResolvedValue({ id: 'rev_1' }),
    getStoreInfo: vi.fn().mockResolvedValue({ name: 'Test Store' }),
    getActivePromotions: vi.fn().mockResolvedValue([]),
    validateCoupon: vi.fn().mockResolvedValue({ code: 'TEST' }),
    createReturn: vi.fn().mockResolvedValue({ id: 'ret_1' }),
    getReturns: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
    getReturn: vi.fn().mockResolvedValue({ id: 'ret_1' }),
    cancelReturn: vi.fn().mockResolvedValue({ id: 'ret_1', status: 'cancelled' }),
    getCustomerGroups: vi.fn().mockResolvedValue([]),
    createQuote: vi.fn().mockResolvedValue({ id: 'quote_1' }),
    getQuotes: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
    getQuote: vi.fn().mockResolvedValue({ id: 'quote_1' }),
    acceptQuote: vi.fn().mockResolvedValue({ id: 'quote_1' }),
    rejectQuote: vi.fn().mockResolvedValue({ id: 'quote_1' }),
    placeBid: vi.fn().mockResolvedValue({ id: 'bid_1' }),
    getBids: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
    getWinningBid: vi.fn().mockResolvedValue(null),
    checkAvailability: vi.fn().mockResolvedValue([]),
    createBooking: vi.fn().mockResolvedValue({ id: 'booking_1' }),
    getBookings: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
    getBooking: vi.fn().mockResolvedValue({ id: 'booking_1' }),
    cancelBooking: vi.fn().mockResolvedValue({ id: 'booking_1' }),
    purchaseGiftCard: vi.fn().mockResolvedValue({ id: 'gc_1' }),
    getGiftCardBalance: vi.fn().mockResolvedValue({ id: 'gc_1', balance: 100 }),
    redeemGiftCard: vi.fn().mockResolvedValue({ id: 'gc_1' }),
    getMyGiftCards: vi.fn().mockResolvedValue([]),
    getGiftCardTransactions: vi.fn().mockResolvedValue([]),
    getBrands: vi.fn().mockResolvedValue([]),
    getCountries: vi.fn().mockResolvedValue([]),
    getStoreLocations: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as CommerceAdapter
}

// ---- Mock Payment Provider ----

const mockSession: PaymentSession = {
  id: 'sess_1',
  providerId: 'mock-pay',
  status: 'authorized',
  amount: 99.99,
  currency: 'SAR',
  providerData: null,
  redirectUrl: null,
  createdAt: new Date().toISOString(),
}

function createMockPaymentProvider(overrides: Partial<PaymentProvider> = {}): PaymentProvider {
  return {
    id: 'mock-pay',
    name: 'Mock Payment',
    createSession: vi.fn().mockResolvedValue(mockSession),
    confirmSession: vi.fn().mockResolvedValue({ ...mockSession, status: 'captured' }),
    getSession: vi.fn().mockResolvedValue(mockSession),
    refund: vi.fn().mockResolvedValue({ ...mockSession, status: 'refunded' }),
    ...overrides,
  }
}

// ---- Tests ----

describe('createCommerce', () => {
  let adapter: CommerceAdapter
  let commerce: ReturnType<typeof createCommerce>

  beforeEach(() => {
    adapter = createMockAdapter()
    commerce = createCommerce({ adapter })
  })

  // ---- Basic properties ----

  it('should expose adapter name and capabilities', () => {
    expect(commerce.name).toBe('mock')
    expect(commerce.capabilities).toEqual(['catalog', 'cart', 'checkout', 'orders', 'customers', 'store'])
  })

  it('should expose event bus', () => {
    expect(commerce.events).toBeDefined()
    expect(typeof commerce.events.on).toBe('function')
    expect(typeof commerce.events.emit).toBe('function')
  })

  // ---- Capability routing ----

  it('hasCapability should return true for supported domains', () => {
    expect(commerce.hasCapability('catalog')).toBe(true)
    expect(commerce.hasCapability('cart')).toBe(true)
  })

  it('hasCapability should return false for unsupported domains', () => {
    expect(commerce.hasCapability('wishlist')).toBe(false)
    expect(commerce.hasCapability('reviews')).toBe(false)
  })

  it('should throw NOT_SUPPORTED for unsupported capabilities', async () => {
    await expect(commerce.getWishlist()).rejects.toThrow(CommerceError)
    await expect(commerce.getWishlist()).rejects.toThrow('does not support the "wishlist" capability')
  })

  // ---- Catalog methods + events ----

  it('should delegate getProduct to adapter and emit product.viewed', async () => {
    const handler = vi.fn()
    commerce.events.on('product.viewed', handler)

    const product = await commerce.getProduct({ id: 'prod_1' })

    expect(product).toEqual({ id: 'prod_1', name: 'Test Product' })
    expect(adapter.getProduct).toHaveBeenCalledWith({ id: 'prod_1' })
    expect(handler).toHaveBeenCalledWith({ product: { id: 'prod_1', name: 'Test Product' } })
  })

  it('should delegate getProducts to adapter', async () => {
    await commerce.getProducts({ query: 'shirt' })
    expect(adapter.getProducts).toHaveBeenCalledWith({ query: 'shirt' })
  })

  // ---- Cart methods + events ----

  it('should delegate createCart and emit cart.created', async () => {
    const handler = vi.fn()
    commerce.events.on('cart.created', handler)

    await commerce.createCart()

    expect(adapter.createCart).toHaveBeenCalled()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('should delegate addToCart and emit cart.item.added', async () => {
    const handler = vi.fn()
    commerce.events.on('cart.item.added', handler)

    await commerce.addToCart('cart_1', { productId: 'prod_1', quantity: 2 })

    expect(adapter.addToCart).toHaveBeenCalledWith('cart_1', { productId: 'prod_1', quantity: 2 })
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'prod_1',
      quantity: 2,
    }))
  })

  // ---- Customer events ----

  it('should emit customer.logged_in on login', async () => {
    const handler = vi.fn()
    commerce.events.on('customer.logged_in', handler)

    await commerce.login('test@example.com', 'password')

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      customer: expect.objectContaining({ email: 'test@example.com' }),
    }))
  })

  it('should emit customer.logged_out on logout', async () => {
    const handler = vi.fn()
    commerce.events.on('customer.logged_out', handler)

    await commerce.logout()

    expect(handler).toHaveBeenCalledOnce()
  })

  // ---- Order events ----

  it('should emit order.created on placeOrder', async () => {
    const handler = vi.fn()
    commerce.events.on('order.created', handler)

    await commerce.placeOrder('cart_1')

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      order: expect.objectContaining({ id: 'ord_1' }),
    }))
  })

  // ---- Payment provider routing ----

  describe('payments', () => {
    let paymentProvider: PaymentProvider

    beforeEach(() => {
      paymentProvider = createMockPaymentProvider()
      commerce = createCommerce({
        adapter,
        payments: { 'mock-pay': paymentProvider },
        defaultPayment: 'mock-pay',
      })
    })

    it('should create payment via default provider', async () => {
      const handler = vi.fn()
      commerce.events.on('payment.created', handler)

      const session = await commerce.createPayment({
        amount: 99.99,
        currency: 'SAR',
      })

      expect(session.id).toBe('sess_1')
      expect(paymentProvider.createSession).toHaveBeenCalled()
      expect(handler).toHaveBeenCalledWith({ session: mockSession })
    })

    it('should create payment via specific provider ID', async () => {
      const stripeProvider = createMockPaymentProvider({ id: 'stripe', name: 'Stripe' })
      commerce = createCommerce({
        adapter,
        payments: { 'mock-pay': paymentProvider, stripe: stripeProvider },
      })

      await commerce.createPayment({ amount: 50, currency: 'USD' }, 'stripe')

      expect(stripeProvider.createSession).toHaveBeenCalled()
      expect(paymentProvider.createSession).not.toHaveBeenCalled()
    })

    it('should throw when no provider specified and no default', async () => {
      commerce = createCommerce({ adapter, payments: { 'mock-pay': paymentProvider } })

      await expect(commerce.createPayment({ amount: 50, currency: 'USD' }))
        .rejects.toThrow('No payment provider specified')
    })

    it('should throw for unknown provider ID', async () => {
      await expect(commerce.createPayment({ amount: 50, currency: 'USD' }, 'unknown'))
        .rejects.toThrow('Payment provider "unknown" is not registered')
    })

    it('should emit payment.confirmed on successful confirmPayment', async () => {
      const handler = vi.fn()
      commerce.events.on('payment.confirmed', handler)

      await commerce.confirmPayment('sess_1', 'mock-pay')

      expect(handler).toHaveBeenCalledOnce()
    })

    it('should emit payment.failed when confirmPayment returns failed status', async () => {
      const failProvider = createMockPaymentProvider({
        confirmSession: vi.fn().mockResolvedValue({ ...mockSession, status: 'failed' }),
      })
      commerce = createCommerce({
        adapter,
        payments: { fail: failProvider },
        defaultPayment: 'fail',
      })

      const handler = vi.fn()
      commerce.events.on('payment.failed', handler)

      await commerce.confirmPayment('sess_1', 'fail')

      expect(handler).toHaveBeenCalledOnce()
    })

    it('should emit payment.refunded on refund', async () => {
      const handler = vi.fn()
      commerce.events.on('payment.refunded', handler)

      await commerce.refundPayment({ sessionId: 'sess_1', amount: 50 }, 'mock-pay')

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ amount: 50 }))
    })
  })

  // ---- Delivery provider routing ----

  describe('delivery', () => {
    let deliveryProvider: DeliveryProvider

    const mockDelivery: Delivery = {
      id: 'del_1',
      providerId: 'mock-delivery',
      status: 'pending',
      origin: { contactName: 'Store', contactPhone: '+96500000000', firstLine: 'Kuwait City' },
      destination: { contactName: 'Ahmed', contactPhone: '+96512345678', firstLine: 'Salmiya' },
      fee: 3.5,
      currency: 'KWD',
      createdAt: new Date().toISOString(),
    }

    const mockEstimate: DeliveryEstimate = {
      fee: 2.0,
      currency: 'KWD',
      estimatedDuration: 30,
    }

    function createMockDeliveryProvider(overrides: Partial<DeliveryProvider> = {}): DeliveryProvider {
      return {
        id: 'mock-delivery',
        name: 'Mock Delivery',
        estimate: vi.fn().mockResolvedValue(mockEstimate),
        createDelivery: vi.fn().mockResolvedValue(mockDelivery),
        getDelivery: vi.fn().mockResolvedValue(mockDelivery),
        cancelDelivery: vi.fn().mockResolvedValue({ ...mockDelivery, status: 'cancelled' }),
        ...overrides,
      }
    }

    beforeEach(() => {
      deliveryProvider = createMockDeliveryProvider()
      commerce = createCommerce({
        adapter,
        delivery: { 'mock-delivery': deliveryProvider },
        defaultDelivery: 'mock-delivery',
      })
    })

    it('should estimate delivery via default provider', async () => {
      const handler = vi.fn()
      commerce.events.on('delivery.estimated', handler)

      const estimate = await commerce.estimateDelivery({
        origin: { contactName: 'Store', contactPhone: '+96500000000', firstLine: 'HQ', latitude: 29.37, longitude: 47.97 },
        destination: { contactName: 'Ahmed', contactPhone: '+96512345678', firstLine: 'Salmiya', latitude: 29.33, longitude: 48.06 },
      })

      expect(estimate.fee).toBe(2.0)
      expect(deliveryProvider.estimate).toHaveBeenCalled()
      expect(handler).toHaveBeenCalledWith({ estimate: mockEstimate })
    })

    it('should create delivery via specific provider ID', async () => {
      const secondProvider = createMockDeliveryProvider({ id: 'parcel', name: 'Parcel' })
      commerce = createCommerce({
        adapter,
        delivery: { 'mock-delivery': deliveryProvider, parcel: secondProvider },
      })

      await commerce.createDelivery({
        origin: { contactName: 'Store', contactPhone: '+96500000000', firstLine: 'HQ', latitude: 29.37, longitude: 47.97 },
        destination: { contactName: 'Ahmed', contactPhone: '+96512345678', firstLine: 'Salmiya', latitude: 29.33, longitude: 48.06 },
      }, 'parcel')

      expect(secondProvider.createDelivery).toHaveBeenCalled()
      expect(deliveryProvider.createDelivery).not.toHaveBeenCalled()
    })

    it('should emit delivery.created on createDelivery', async () => {
      const handler = vi.fn()
      commerce.events.on('delivery.created', handler)

      await commerce.createDelivery({
        origin: { contactName: 'Store', contactPhone: '+96500000000', firstLine: 'HQ', latitude: 29.37, longitude: 47.97 },
        destination: { contactName: 'Ahmed', contactPhone: '+96512345678', firstLine: 'Salmiya', latitude: 29.33, longitude: 48.06 },
        orderId: 'ord_1',
      })

      expect(handler).toHaveBeenCalledWith({ delivery: mockDelivery })
    })

    it('should emit delivery.cancelled on cancelDelivery', async () => {
      const handler = vi.fn()
      commerce.events.on('delivery.cancelled', handler)

      await commerce.cancelDelivery('del_1', 'mock-delivery')

      expect(handler).toHaveBeenCalledOnce()
    })

    it('should delegate getDelivery to provider', async () => {
      const result = await commerce.getDelivery('del_1', 'mock-delivery')

      expect(result.id).toBe('del_1')
      expect(deliveryProvider.getDelivery).toHaveBeenCalledWith('del_1')
    })

    it('should throw when no provider specified and no default', async () => {
      commerce = createCommerce({ adapter, delivery: { 'mock-delivery': deliveryProvider } })

      await expect(commerce.estimateDelivery({
        origin: { contactName: 'Store', contactPhone: '+965', firstLine: 'HQ', latitude: 29, longitude: 47 },
        destination: { contactName: 'A', contactPhone: '+965', firstLine: 'S', latitude: 29, longitude: 48 },
      })).rejects.toThrow('No delivery provider specified')
    })

    it('should throw for unknown provider ID', async () => {
      await expect(commerce.createDelivery({
        origin: { contactName: 'Store', contactPhone: '+965', firstLine: 'HQ', latitude: 29, longitude: 47 },
        destination: { contactName: 'A', contactPhone: '+965', firstLine: 'S', latitude: 29, longitude: 48 },
      }, 'unknown')).rejects.toThrow('Delivery provider "unknown" is not registered')
    })

    it('should throw when verifyWebhook is not implemented', async () => {
      const noWebhookProvider = createMockDeliveryProvider()
      delete (noWebhookProvider as any).verifyWebhook
      commerce = createCommerce({
        adapter,
        delivery: { test: noWebhookProvider },
        defaultDelivery: 'test',
      })

      await expect(commerce.verifyDeliveryWebhook('{}', 'sig', 'test'))
        .rejects.toThrow('does not support webhook verification')
    })
  })

  // ---- Cleanup ----

  it('should destroy cleanly', () => {
    expect(() => commerce.destroy()).not.toThrow()
  })

  it('should remove all event listeners on destroy', async () => {
    const handler = vi.fn()
    commerce.events.on('product.viewed', handler)
    commerce.destroy()

    await commerce.events.emit('product.viewed', { product: {} as any })

    expect(handler).not.toHaveBeenCalled()
  })
})
