// ---------------------------------------------------------------------------
// @commercejs/core — Commerce Events Catalog
// ---------------------------------------------------------------------------
// Typed event definitions for the commerce event bus.
// Every commerce operation emits events that plugins, webhooks, and
// analytics can subscribe to.
// ---------------------------------------------------------------------------

import type {
  Product,
  Cart,
  Order,
  Customer,
  PaymentSession,
  ReturnRequest,
  Delivery,
  DeliveryEstimate,
  DeliveryWebhookEvent,
} from '@commercejs/types'

// ---- Event Map (union of all events) ----

export interface CommerceEvents {
  // Product events
  'product.viewed': { product: Product }

  // Cart events
  'cart.created': { cart: Cart }
  'cart.item.added': { cart: Cart; productId: string; quantity: number }
  'cart.item.updated': { cart: Cart; itemId: string; quantity: number }
  'cart.item.removed': { cart: Cart; itemId: string }
  'cart.coupon.applied': { cart: Cart; code: string }
  'cart.coupon.removed': { cart: Cart }

  // Order events
  'order.created': { order: Order }
  'order.status.changed': { order: Order; previousStatus: string; newStatus: string }
  'order.cancelled': { order: Order }

  // Payment events
  'payment.created': { session: PaymentSession }
  'payment.confirmed': { session: PaymentSession }
  'payment.failed': { session: PaymentSession; error?: string }
  'payment.refunded': { session: PaymentSession; amount: number }
  'payment.webhook.received': { session: PaymentSession; rawEvent: unknown }

  // Delivery events
  'delivery.estimated': { estimate: DeliveryEstimate }
  'delivery.created': { delivery: Delivery }
  'delivery.updated': { delivery: Delivery; event: DeliveryWebhookEvent }
  'delivery.cancelled': { delivery: Delivery }

  // Customer events
  'customer.logged_in': { customer: Customer }
  'customer.registered': { customer: Customer }
  'customer.updated': { customer: Customer }
  'customer.logged_out': Record<string, never>

  // Return events
  'return.created': { returnRequest: ReturnRequest }
  'return.cancelled': { returnRequest: ReturnRequest }

  // Checkout events
  'checkout.started': { cartId: string }
  'checkout.completed': { order: Order; session: PaymentSession }

  // Extension point — any string key is allowed for custom events
  [key: string]: unknown
}
