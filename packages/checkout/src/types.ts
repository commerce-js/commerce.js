// ---------------------------------------------------------------------------
// Checkout engine types
// ---------------------------------------------------------------------------

import type { Address, PaymentProvider, PaymentSession } from '@commercejs/types'

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

/** Allowed state transitions */
export const CHECKOUT_TRANSITIONS: Record<CheckoutState, readonly CheckoutState[]> = {
  idle: ['info'],
  info: ['shipping'],
  shipping: ['payment'],
  payment: ['confirming', 'failed'],
  confirming: ['complete', 'failed'],
  complete: [],        // terminal
  failed: ['payment'], // retry
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

/** Configuration for creating a CheckoutSession */
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
}

// ---- Session snapshot ----------------------------------------------------

/** Serializable snapshot of the checkout session state */
export interface CheckoutSnapshot {
  state: CheckoutState
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
}
