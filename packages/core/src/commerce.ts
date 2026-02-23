// ---------------------------------------------------------------------------
// @commercejs/core — createCommerce() factory
// ---------------------------------------------------------------------------
// The main entry point for the Commerce.js orchestration engine.
// Composes an adapter, optional payment providers, event bus, and webhook
// dispatcher into a single, capability-aware commerce client.
// ---------------------------------------------------------------------------

import type {
  CommerceAdapter,
  PaymentProvider,
  DeliveryProvider,
  Delivery,
  DeliveryEstimate,
  EstimateDeliveryInput,
  CreateDeliveryInput,
  DeliveryWebhookEvent,
  AdapterDomain,
  Product,
  Cart,
  Order,
  Customer,
  PaymentSession,
  SearchParams,
  SearchResult,
  GetProductParams,
  GetCategoriesParams,
  Category,
  AddToCartInput,
  Address,
  ShippingMethod,
  PaymentMethod,
  CreatePaymentSessionInput,
  RefundInput,
  RegisterInput,
  UpdateCustomerInput,
  Wishlist,
  Review,
  ReviewInput,
  ReviewSummary,
  StoreInfo,
  Promotion,
  Coupon,
  ReturnRequest,
  CreateReturnInput,
  Brand,
  Country,
  StoreLocation,
  PaginatedResult,
  PaginationParams,
  CreateOrderInput,
  OrderStatusInfo,
  OrderHistoryEntry,
  UpdateOrderStatusInput,
  NotificationProvider,
  NotificationRule,
  AnalyticsProvider,
  StorageProvider,
  UploadInput,
  StorageUploadResult,
  PresignedUrlOptions,
  PresignedUrlResult,
} from '@commercejs/types'
import { CommerceError } from '@commercejs/types'
import { CommerceEventBus } from './event-bus.js'
import { createWebhookDispatcher } from './webhook-dispatcher.js'
import type { CommerceEvents } from './events.js'
import type { WebhookEndpoint } from './webhook-dispatcher.js'

// ---- Configuration ----

export interface CommerceConfig {
  /** The commerce adapter (e.g., SallaAdapter, MedusaAdapter, CatalogAdapter) */
  adapter: CommerceAdapter

  /** Payment providers keyed by ID (e.g., { tap: new TapPaymentProvider(...) }) */
  payments?: Record<string, PaymentProvider>

  /** Default payment provider ID */
  defaultPayment?: string

  /** Webhook endpoints for outbound event delivery */
  webhooks?: WebhookEndpoint[]

  /** Custom fetch for webhook dispatch (testing / edge runtimes) */
  fetch?: typeof globalThis.fetch

  /** Webhook HMAC signing function */
  sign?: (payload: string, secret: string) => string | Promise<string>

  /** Notification providers keyed by ID */
  notifications?: Record<string, NotificationProvider>

  /** Notification rules — event → channel → provider dispatch */
  notificationRules?: NotificationRule[]

  /** Analytics providers (all receive all events) */
  analytics?: AnalyticsProvider[]

  /** Storage provider for file uploads (required for native platform) */
  storage?: StorageProvider

  /** Delivery providers keyed by ID (e.g., { armada: new ArmadaDeliveryProvider(...) }) */
  delivery?: Record<string, DeliveryProvider>

  /** Default delivery provider ID */
  defaultDelivery?: string

  /** Auto-dispatch delivery when an order is created (for local_delivery fulfillment) */
  autoDispatch?: boolean
}

// ---- Commerce Instance ----

export interface CommerceInstance {
  /** Adapter name */
  readonly name: string

  /** Supported capability domains */
  readonly capabilities: AdapterDomain[]

  /** Event bus for subscribing to commerce events */
  readonly events: CommerceEventBus<CommerceEvents>

  // ---- Capability checks ----
  hasCapability(domain: AdapterDomain): boolean

  // ---- Catalog ----
  getProduct(params: GetProductParams): Promise<Product>
  getProducts(params: SearchParams): Promise<SearchResult>
  getCategories(params?: GetCategoriesParams): Promise<Category[]>

  // ---- Cart ----
  createCart(): Promise<Cart>
  getCart(cartId: string): Promise<Cart>
  addToCart(cartId: string, item: AddToCartInput): Promise<Cart>
  updateCartItem(cartId: string, itemId: string, quantity: number): Promise<Cart>
  removeFromCart(cartId: string, itemId: string): Promise<Cart>

  // ---- Checkout ----
  getShippingMethods(cartId: string): Promise<ShippingMethod[]>
  setShippingAddress(cartId: string, address: Omit<Address, 'id' | 'isDefault'>): Promise<Cart>
  setBillingAddress(cartId: string, address: Omit<Address, 'id' | 'isDefault'>): Promise<Cart>
  setShippingMethod(cartId: string, methodId: string): Promise<Cart>
  getPaymentMethods(cartId: string): Promise<PaymentMethod[]>
  setPaymentMethod(cartId: string, methodId: string): Promise<Cart>
  placeOrder(cartId: string): Promise<Order>

  // ---- Customer ----
  login(email: string, password: string): Promise<Customer>
  register(input: RegisterInput): Promise<Customer>
  getCustomer(): Promise<Customer>
  updateCustomer(input: UpdateCustomerInput): Promise<Customer>
  logout(): Promise<void>
  getAddresses(): Promise<Address[]>
  addAddress(address: Omit<Address, 'id'>): Promise<Address>
  updateAddress(addressId: string, address: Partial<Omit<Address, 'id'>>): Promise<Address>
  deleteAddress(addressId: string): Promise<void>

  // ---- Orders ----
  createOrder(input: CreateOrderInput): Promise<Order>
  getOrder(orderId: string): Promise<Order>
  getCustomerOrders(params?: PaginationParams): Promise<PaginatedResult<Order>>
  getOrderStatuses(): Promise<OrderStatusInfo[]>
  updateOrderStatus(orderId: string, input: UpdateOrderStatusInput): Promise<void>
  cancelOrder(orderId: string, note?: string): Promise<void>
  getOrderHistory(orderId: string): Promise<OrderHistoryEntry[]>

  // ---- Wishlist ----
  getWishlist(): Promise<Wishlist>
  addToWishlist(productId: string, variantId?: string): Promise<Wishlist>
  removeFromWishlist(itemId: string): Promise<Wishlist>

  // ---- Reviews ----
  getProductReviews(productId: string, params?: PaginationParams): Promise<PaginatedResult<Review>>
  getReviewSummary(productId: string): Promise<ReviewSummary>
  submitReview(input: ReviewInput): Promise<Review>

  // ---- Store ----
  getStoreInfo(): Promise<StoreInfo>
  getBrands(): Promise<Brand[]>
  getCountries(): Promise<Country[]>
  getStoreLocations(): Promise<StoreLocation[]>

  // ---- Promotions ----
  getActivePromotions(): Promise<Promotion[]>
  validateCoupon(code: string): Promise<Coupon>

  // ---- Returns ----
  createReturn(input: CreateReturnInput): Promise<ReturnRequest>
  getReturns(params?: PaginationParams): Promise<PaginatedResult<ReturnRequest>>
  getReturn(returnId: string): Promise<ReturnRequest>
  cancelReturn(returnId: string): Promise<ReturnRequest>

  // ---- Payments (multi-provider) ----
  createPayment(input: CreatePaymentSessionInput, providerId?: string): Promise<PaymentSession>
  confirmPayment(sessionId: string, providerId: string, data?: Record<string, unknown>): Promise<PaymentSession>
  getPayment(sessionId: string, providerId: string): Promise<PaymentSession>
  refundPayment(input: RefundInput, providerId: string): Promise<PaymentSession>

  // ---- Storage ----
  uploadFile(input: UploadInput): Promise<StorageUploadResult>
  deleteFile(key: string): Promise<void>
  getFileUrl(key: string): string
  getPresignedUploadUrl(key: string, options?: PresignedUrlOptions): Promise<PresignedUrlResult>
  getPresignedDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<PresignedUrlResult>

  // ---- Delivery (multi-provider) ----
  estimateDelivery(input: EstimateDeliveryInput, providerId?: string): Promise<DeliveryEstimate>
  createDelivery(input: CreateDeliveryInput, providerId?: string): Promise<Delivery>
  getDelivery(deliveryId: string, providerId: string): Promise<Delivery>
  cancelDelivery(deliveryId: string, providerId: string): Promise<Delivery>
  verifyDeliveryWebhook(payload: string | Uint8Array, signature: string, providerId: string): Promise<DeliveryWebhookEvent>

  /** Cleanup — removes event listeners and webhook subscriptions */
  destroy(): void
}

// ---- Factory ----

/**
 * Create a Commerce.js instance.
 *
 * @example
 * ```ts
 * import { createCommerce } from '@commercejs/core'
 * import { SallaAdapter } from '@commercejs/adapter-salla'
 * import { TapPaymentProvider } from '@commercejs/payment-tap'
 *
 * const commerce = createCommerce({
 *   adapter: new SallaAdapter({ token: '...' }),
 *   payments: {
 *     tap: new TapPaymentProvider({ secretKey: '...' }),
 *   },
 *   defaultPayment: 'tap',
 *   webhooks: [
 *     { id: 'crm', url: 'https://crm.example.com/hook', events: ['order.created'] },
 *   ],
 * })
 *
 * const products = await commerce.getProducts({ query: 'shirt' })
 * commerce.events.on('order.created', (data) => console.log('New order:', data.order.id))
 * ```
 */
export function createCommerce(config: CommerceConfig): CommerceInstance {
  const { adapter, payments = {}, defaultPayment, webhooks, delivery = {}, defaultDelivery } = config
  const events = new CommerceEventBus<CommerceEvents>()

  // Wire up webhook dispatcher if endpoints are configured
  const webhookDispatcher = webhooks?.length
    ? createWebhookDispatcher(events, {
        endpoints: webhooks,
        fetch: config.fetch,
        sign: config.sign,
      })
    : null

  // Wire up notification rules
  const notificationCleanups: Array<() => void> = []
  if (config.notificationRules?.length && config.notifications) {
    for (const rule of config.notificationRules) {
      const provider = config.notifications[rule.provider]
      if (!provider) continue

      const cleanup = events.on(rule.event as keyof CommerceEvents & string, async (payload: unknown) => {
        const message = rule.buildMessage(payload)
        if (message) {
          try {
            await provider.send(rule.channel, {
              ...message,
              template: message.template ?? rule.template,
            })
          } catch {
            // Notification failures are non-fatal — log but don't throw
          }
        }
      })
      notificationCleanups.push(cleanup)
    }
  }

  // Wire up analytics auto-tracking
  const analyticsCleanups: Array<() => void> = []
  if (config.analytics?.length) {
    // Subscribe to wildcard to track all commerce events
    const cleanup = events.onAny((event: string, payload: unknown) => {
      for (const provider of config.analytics!) {
        try {
          provider.track(event, payload as Record<string, unknown>)
        } catch {
          // Analytics failures are non-fatal
        }
      }
    })
    analyticsCleanups.push(cleanup)
  }

  // ---- Helpers ----

  function requireCapability(domain: AdapterDomain): void {
    if (!adapter.capabilities.includes(domain)) {
      throw new CommerceError(
        `Adapter "${adapter.name}" does not support the "${domain}" capability.`,
        'NOT_SUPPORTED',
        501,
      )
    }
  }

  function getPaymentProvider(providerId?: string): PaymentProvider {
    const id = providerId ?? defaultPayment
    if (!id) {
      throw new CommerceError(
        'No payment provider specified and no default configured.',
        'CONFIGURATION_ERROR',
        500,
      )
    }
    const provider = payments[id]
    if (!provider) {
      throw new CommerceError(
        `Payment provider "${id}" is not registered.`,
        'NOT_FOUND',
        404,
      )
    }
    return provider
  }

  function getDeliveryProvider(providerId?: string): DeliveryProvider {
    const id = providerId ?? defaultDelivery
    if (!id) {
      throw new CommerceError(
        'No delivery provider specified and no default configured.',
        'CONFIGURATION_ERROR',
        500,
      )
    }
    const provider = delivery[id]
    if (!provider) {
      throw new CommerceError(
        `Delivery provider "${id}" is not registered.`,
        'NOT_FOUND',
        404,
      )
    }
    return provider
  }

  // ---- Build instance ----

  const instance: CommerceInstance = {
    get name() { return adapter.name },
    get capabilities() { return adapter.capabilities },
    events,

    hasCapability(domain: AdapterDomain) {
      return adapter.capabilities.includes(domain)
    },

    // ---- Catalog ----

    async getProduct(params) {
      requireCapability('catalog')
      const product = await adapter.getProduct(params)
      await events.emit('product.viewed', { product })
      return product
    },

    async getProducts(params) {
      requireCapability('catalog')
      return adapter.getProducts(params)
    },

    async getCategories(params) {
      requireCapability('catalog')
      return adapter.getCategories(params)
    },

    // ---- Cart ----

    async createCart() {
      requireCapability('cart')
      const cart = await adapter.createCart()
      await events.emit('cart.created', { cart })
      return cart
    },

    async getCart(cartId) {
      requireCapability('cart')
      return adapter.getCart(cartId)
    },

    async addToCart(cartId, item) {
      requireCapability('cart')
      const cart = await adapter.addToCart(cartId, item)
      await events.emit('cart.item.added', { cart, productId: item.productId, quantity: item.quantity })
      return cart
    },

    async updateCartItem(cartId, itemId, quantity) {
      requireCapability('cart')
      const cart = await adapter.updateCartItem(cartId, itemId, quantity)
      await events.emit('cart.item.updated', { cart, itemId, quantity })
      return cart
    },

    async removeFromCart(cartId, itemId) {
      requireCapability('cart')
      const cart = await adapter.removeFromCart(cartId, itemId)
      await events.emit('cart.item.removed', { cart, itemId })
      return cart
    },

    // ---- Checkout ----

    async getShippingMethods(cartId) {
      requireCapability('checkout')
      return adapter.getShippingMethods(cartId)
    },

    async setShippingAddress(cartId, address) {
      requireCapability('checkout')
      return adapter.setShippingAddress(cartId, address)
    },

    async setBillingAddress(cartId, address) {
      requireCapability('checkout')
      return adapter.setBillingAddress(cartId, address)
    },

    async setShippingMethod(cartId, methodId) {
      requireCapability('checkout')
      return adapter.setShippingMethod(cartId, methodId)
    },

    async getPaymentMethods(cartId) {
      requireCapability('checkout')
      return adapter.getPaymentMethods(cartId)
    },

    async setPaymentMethod(cartId, methodId) {
      requireCapability('checkout')
      return adapter.setPaymentMethod(cartId, methodId)
    },

    async placeOrder(cartId) {
      requireCapability('checkout')
      await events.emit('checkout.started', { cartId })
      const order = await adapter.placeOrder(cartId)
      await events.emit('order.created', { order })
      return order
    },

    // ---- Customer ----

    async login(email, password) {
      requireCapability('customers')
      const customer = await adapter.login(email, password)
      await events.emit('customer.logged_in', { customer })
      return customer
    },

    async register(input) {
      requireCapability('customers')
      const customer = await adapter.register(input)
      await events.emit('customer.registered', { customer })
      return customer
    },

    async getCustomer() {
      requireCapability('customers')
      return adapter.getCustomer()
    },

    async updateCustomer(input) {
      requireCapability('customers')
      const customer = await adapter.updateCustomer(input)
      await events.emit('customer.updated', { customer })
      return customer
    },

    async logout() {
      requireCapability('customers')
      await adapter.logout()
      await events.emit('customer.logged_out', {})
    },

    async getAddresses() {
      requireCapability('customers')
      return adapter.getAddresses()
    },

    async addAddress(address) {
      requireCapability('customers')
      return adapter.addAddress(address)
    },

    async updateAddress(addressId, address) {
      requireCapability('customers')
      return adapter.updateAddress(addressId, address)
    },

    async deleteAddress(addressId) {
      requireCapability('customers')
      return adapter.deleteAddress(addressId)
    },

    // ---- Orders ----

    async createOrder(input) {
      requireCapability('orders')
      const order = await adapter.createOrder(input)
      await events.emit('order.created', { order })
      return order
    },

    async getOrder(orderId) {
      requireCapability('orders')
      return adapter.getOrder(orderId)
    },

    async getCustomerOrders(params) {
      requireCapability('orders')
      return adapter.getCustomerOrders(params)
    },

    async getOrderStatuses() {
      requireCapability('orders')
      return adapter.getOrderStatuses()
    },

    async updateOrderStatus(orderId, input) {
      requireCapability('orders')
      await adapter.updateOrderStatus(orderId, input)
    },

    async cancelOrder(orderId, note) {
      requireCapability('orders')
      await adapter.cancelOrder(orderId, note)
    },

    async getOrderHistory(orderId) {
      requireCapability('orders')
      return adapter.getOrderHistory(orderId)
    },

    // ---- Wishlist ----

    async getWishlist() {
      requireCapability('wishlist')
      return adapter.getWishlist()
    },

    async addToWishlist(productId, variantId) {
      requireCapability('wishlist')
      return adapter.addToWishlist(productId, variantId)
    },

    async removeFromWishlist(itemId) {
      requireCapability('wishlist')
      return adapter.removeFromWishlist(itemId)
    },

    // ---- Reviews ----

    async getProductReviews(productId, params) {
      requireCapability('reviews')
      return adapter.getProductReviews(productId, params)
    },

    async getReviewSummary(productId) {
      requireCapability('reviews')
      return adapter.getReviewSummary(productId)
    },

    async submitReview(input) {
      requireCapability('reviews')
      return adapter.submitReview(input)
    },

    // ---- Store ----

    async getStoreInfo() {
      requireCapability('store')
      return adapter.getStoreInfo()
    },

    async getBrands() {
      requireCapability('brands')
      return adapter.getBrands()
    },

    async getCountries() {
      requireCapability('countries')
      return adapter.getCountries()
    },

    async getStoreLocations() {
      requireCapability('locations')
      return adapter.getStoreLocations()
    },

    // ---- Promotions ----

    async getActivePromotions() {
      requireCapability('promotions')
      return adapter.getActivePromotions()
    },

    async validateCoupon(code) {
      requireCapability('promotions')
      return adapter.validateCoupon(code)
    },

    // ---- Returns ----

    async createReturn(input) {
      requireCapability('returns')
      const returnRequest = await adapter.createReturn(input)
      await events.emit('return.created', { returnRequest })
      return returnRequest
    },

    async getReturns(params) {
      requireCapability('returns')
      return adapter.getReturns(params)
    },

    async getReturn(returnId) {
      requireCapability('returns')
      return adapter.getReturn(returnId)
    },

    async cancelReturn(returnId) {
      requireCapability('returns')
      const returnRequest = await adapter.cancelReturn(returnId)
      await events.emit('return.cancelled', { returnRequest })
      return returnRequest
    },

    // ---- Payments ----

    async createPayment(input, providerId) {
      const provider = getPaymentProvider(providerId)
      const session = await provider.createSession(input)
      await events.emit('payment.created', { session })
      return session
    },

    async confirmPayment(sessionId, providerId, data) {
      const provider = getPaymentProvider(providerId)
      const session = await provider.confirmSession(sessionId, data)
      if (session.status === 'captured' || session.status === 'authorized') {
        await events.emit('payment.confirmed', { session })
      }
      else if (session.status === 'failed') {
        await events.emit('payment.failed', { session })
      }
      return session
    },

    async getPayment(sessionId, providerId) {
      const provider = getPaymentProvider(providerId)
      return provider.getSession(sessionId)
    },

    async refundPayment(input, providerId) {
      const provider = getPaymentProvider(providerId)
      const session = await provider.refund(input)
      await events.emit('payment.refunded', { session, amount: input.amount ?? session.amount })
      return session
    },

    // ---- Storage ----

    async uploadFile(input) {
      if (!config.storage) {
        throw new CommerceError('No storage provider configured.', 'CONFIGURATION_ERROR', 500)
      }
      const result = await config.storage.upload(input)
      await events.emit('file.uploaded' as keyof CommerceEvents & string, { key: result.key, url: result.url } as never)
      return result
    },

    async deleteFile(key) {
      if (!config.storage) {
        throw new CommerceError('No storage provider configured.', 'CONFIGURATION_ERROR', 500)
      }
      await config.storage.delete(key)
      await events.emit('file.deleted' as keyof CommerceEvents & string, { key } as never)
    },

    getFileUrl(key) {
      if (!config.storage) {
        throw new CommerceError('No storage provider configured.', 'CONFIGURATION_ERROR', 500)
      }
      return config.storage.getUrl(key)
    },

    async getPresignedUploadUrl(key, options) {
      if (!config.storage) {
        throw new CommerceError('No storage provider configured.', 'CONFIGURATION_ERROR', 500)
      }
      return config.storage.getPresignedUploadUrl(key, options)
    },

    async getPresignedDownloadUrl(key, options) {
      if (!config.storage) {
        throw new CommerceError('No storage provider configured.', 'CONFIGURATION_ERROR', 500)
      }
      return config.storage.getPresignedDownloadUrl(key, options)
    },

    // ---- Delivery ----

    async estimateDelivery(input, providerId) {
      const provider = getDeliveryProvider(providerId)
      const estimate = await provider.estimate(input)
      await events.emit('delivery.estimated', { estimate })
      return estimate
    },

    async createDelivery(input, providerId) {
      const provider = getDeliveryProvider(providerId)
      const deliv = await provider.createDelivery(input)
      await events.emit('delivery.created', { delivery: deliv })
      return deliv
    },

    async getDelivery(deliveryId, providerId) {
      const provider = getDeliveryProvider(providerId)
      return provider.getDelivery(deliveryId)
    },

    async cancelDelivery(deliveryId, providerId) {
      const provider = getDeliveryProvider(providerId)
      const deliv = await provider.cancelDelivery(deliveryId)
      await events.emit('delivery.cancelled', { delivery: deliv })
      return deliv
    },

    async verifyDeliveryWebhook(payload, signature, providerId) {
      const provider = getDeliveryProvider(providerId)
      if (!provider.verifyWebhook) {
        throw new CommerceError(
          `Delivery provider "${provider.id}" does not support webhook verification.`,
          'NOT_SUPPORTED',
          501,
        )
      }
      const webhookEvent = await provider.verifyWebhook(payload, signature)
      const deliv = await provider.getDelivery(webhookEvent.deliveryId)
      await events.emit('delivery.updated', { delivery: deliv, event: webhookEvent })
      return webhookEvent
    },

    // ---- Cleanup ----

    destroy() {
      events.removeAllListeners()
      webhookDispatcher?.unsubscribe()
      notificationCleanups.forEach(fn => fn())
      analyticsCleanups.forEach(fn => fn())
    },
  }

  return instance
}
