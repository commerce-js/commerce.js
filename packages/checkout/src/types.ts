// ---------------------------------------------------------------------------
// Checkout engine types
// ---------------------------------------------------------------------------

import type { Address, FulfillmentType, PaymentProvider, PaymentSession } from '@commercejs/types'

// ---- Channel & fulfillment ------------------------------------------------

/** Sales channel for the checkout session */
export type CheckoutChannel = 'web' | 'pos' | 'agent' | 'link'

/** How the order is fulfilled — determines which checkout steps are required */
export type CheckoutFulfillment = FulfillmentType | 'none'

// ---- State machine -------------------------------------------------------

/** All possible checkout states */
export type CheckoutState =
  | 'idle'
  | 'info'
  | 'shipping'
  | 'payment'
  | 'confirming'
  | 'complete'
  | 'failed'

/**
 * Build the transition map based on fulfillment type.
 *
 * - `shipping` / `local_delivery`: info → shipping → payment (address required)
 * - `pickup` / `none`: info → payment (skip address/shipping)
 */
export function buildTransitions(fulfillment: CheckoutFulfillment): Record<CheckoutState, readonly CheckoutState[]> {
  const needsAddress = fulfillment === 'shipping' || fulfillment === 'local_delivery'
  return {
    idle: ['info'],
    info: needsAddress ? ['shipping'] : ['payment'],
    shipping: ['payment'],
    payment: ['confirming', 'failed'],
    confirming: ['complete', 'failed'],
    complete: [],
    failed: ['payment'],
  }
}

// ---- Customer info -------------------------------------------------------

/** Customer details collected during checkout */
export interface CheckoutCustomerInfo {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
}

// ---- Session config ------------------------------------------------------

/** User-facing configuration for creating a CheckoutSession */
export interface CheckoutSessionConfig {
  /** The payment provider to use for this session */
  paymentProvider: PaymentProvider
  /** Currency code (e.g. 'SAR', 'USD') */
  currency: string
  /** Total amount — can be updated before payment */
  amount: number
  /** Where to return after 3DS/redirect */
  returnUrl?: string
  /** Where to redirect on cancel */
  cancelUrl?: string
  /** Merchant-specific order ID (if known at checkout start) */
  orderId?: string
  /** Per-transaction webhook URL (e.g., Tap's post.url) */
  webhookUrl?: string
  /** Sales channel — determines default fulfillment behavior */
  channel?: CheckoutChannel
  /** How the order is fulfilled — determines required checkout steps */
  fulfillment?: CheckoutFulfillment
  /** Session TTL in milliseconds (default: no expiry) */
  expiresIn?: number
}

/** Internally resolved config — all fields have concrete values */
export interface ResolvedCheckoutConfig {
  paymentProvider: PaymentProvider
  currency: string
  amount: number
  returnUrl: string | null
  cancelUrl: string | null
  orderId: string | null
  webhookUrl: string | null
  channel: CheckoutChannel
  fulfillment: CheckoutFulfillment
  expiresAt: number | null
}

// ---- Session snapshot ----------------------------------------------------

/** Serializable snapshot of the checkout session state */
export interface CheckoutSnapshot {
  state: CheckoutState
  channel: CheckoutChannel
  fulfillment: CheckoutFulfillment
  expiresAt: string | null
  customerInfo: CheckoutCustomerInfo | null
  shippingAddress: Omit<Address, 'id' | 'isDefault'> | null
  billingAddress: Omit<Address, 'id' | 'isDefault'> | null
  shippingMethodId: string | null
  paymentSession: PaymentSession | null
  amount: number
  currency: string
  orderId: string | null
  error: string | null
}

// ---- Events --------------------------------------------------------------

/** Events emitted by CheckoutSession */
export interface CheckoutEvents {
  /** Fired on every state transition */
  stateChange: { from: CheckoutState; to: CheckoutState }
  /** Fired when payment requires customer action (redirect) */
  paymentAction: { redirectUrl: string }
  /** Fired when checkout completes successfully */
  complete: { paymentSession: PaymentSession }
  /** Fired on any error */
  error: { error: Error; state: CheckoutState }
  /** Fired when the session expires */
  expired: {}
}
