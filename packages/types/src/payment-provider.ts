// ---------------------------------------------------------------------------
// PaymentProvider — pluggable gateway interface (Strategy pattern)
// ---------------------------------------------------------------------------
//
// Each payment gateway (Stripe, Tap, Salla, SoftPOS) implements this
// interface. The Universal Checkout engine will use a PaymentProviderRegistry
// to select the right provider at runtime.
// ---------------------------------------------------------------------------

import type { Maybe } from './common.js'

// ---- Session status --------------------------------------------------------

/** Status of a payment session through its lifecycle */
export type PaymentSessionStatus =
  | 'pending'             // created, awaiting customer action
  | 'requires_action'     // 3DS, redirect, OTP needed
  | 'processing'          // payment being processed by gateway
  | 'authorized'          // funds held, capture needed
  | 'captured'            // funds collected
  | 'failed'              // payment failed
  | 'cancelled'           // cancelled before capture
  | 'refunded'            // fully refunded
  | 'partially_refunded'  // partially refunded

// ---- Payment session -------------------------------------------------------

/**
 * A payment session — the unit of work for a payment.
 *
 * Created by `PaymentProvider.createSession()`, progressed through
 * confirm → capture, and optionally refunded.
 */
export interface PaymentSession {
  /** Unique session identifier (provider-scoped) */
  id: string
  /** Which provider created this session */
  providerId: string
  /** Current status */
  status: PaymentSessionStatus
  /** Payment amount (in major currency units, e.g., 99.99) */
  amount: number
  /** ISO 4217 currency code */
  currency: string
  /** Provider-specific data (e.g., Stripe PaymentIntent ID, Tap charge ID) */
  providerData: Maybe<Record<string, unknown>>
  /** URL to redirect customer for 3DS / authentication / hosted page */
  redirectUrl: Maybe<string>
  /** When the session was created */
  createdAt: string
}

// ---- Inputs ----------------------------------------------------------------

/** Input to create a payment session */
export interface CreatePaymentSessionInput {
  /** Payment amount (major currency units) */
  amount: number
  /** ISO 4217 currency code (e.g., 'SAR', 'USD') */
  currency: string
  /** Client-side token from gateway SDK (e.g., Tap tok_xxx, Stripe pm_xxx) */
  sourceToken?: string
  /** Order ID to associate with this payment */
  orderId?: string
  /** Customer ID (if authenticated) */
  customerId?: string
  /** Customer details — required by Tap and most gateways */
  customer?: {
    email?: string
    firstName?: string
    lastName?: string
    phone?: string
  }
  /** Where to redirect after 3DS / hosted payment page */
  returnUrl?: string
  /** Cancel URL for hosted payment pages */
  cancelUrl?: string
  /** Per-transaction webhook URL — Tap sends charge events to this URL as `post.url` */
  webhookUrl?: string
  /** Idempotency key to prevent duplicate charges on retries */
  idempotencyKey?: string
  /** Whether to save the card for future use (returns customer ID + card ID) */
  saveCard?: boolean
  /** Arbitrary metadata passed to the gateway */
  metadata?: Record<string, unknown>
}

/** Input for refunds */
export interface RefundInput {
  /** Session ID of the payment to refund */
  sessionId: string
  /** Partial refund amount; omit for full refund */
  amount?: number
  /** Reason for the refund */
  reason?: string
}

// ---- Webhook event ---------------------------------------------------------

/** Parsed webhook event from a payment provider */
export interface PaymentWebhookEvent {
  /** Event type (e.g., 'payment.captured', 'refund.created') */
  type: string
  /** Related payment session ID */
  sessionId: string
  /** Raw event data from the provider */
  data: Record<string, unknown>
}

// ---- Provider interface ----------------------------------------------------

/**
 * Pluggable payment gateway interface.
 *
 * Each gateway (Stripe, Tap, SoftPOS) implements this interface.
 * The core lifecycle is: `create → confirm → refund`.
 * Optional methods (`captureSession`, `cancelSession`, `verifyWebhook`)
 * support auth+capture gateways and webhook-driven flows.
 *
 * @example
 * ```ts
 * const tap = new TapPaymentProvider({ secretKey: 'sk_test_...' })
 * const session = await tap.createSession({
 *   amount: 99.99,
 *   currency: 'SAR',
 *   sourceToken: 'tok_xxx', // from goSell.js
 *   returnUrl: 'https://store.com/checkout/confirm',
 * })
 * // redirect customer to session.redirectUrl for 3DS...
 * const confirmed = await tap.confirmSession(session.id)
 * ```
 */
export interface PaymentProvider {
  /** Unique provider identifier (e.g., 'stripe', 'tap') */
  readonly id: string
  /** Human-readable provider name (e.g., 'Stripe', 'Tap Payments') */
  readonly name: string

  /** Create a payment session (charge or redirect) */
  createSession(input: CreatePaymentSessionInput): Promise<PaymentSession>

  /** Confirm a payment after customer action (3DS redirect, OTP) */
  confirmSession(sessionId: string, data?: Record<string, unknown>): Promise<PaymentSession>

  /** Get current status of a payment session */
  getSession(sessionId: string): Promise<PaymentSession>

  /** Refund a captured payment (full or partial) */
  refund(input: RefundInput): Promise<PaymentSession>

  /** Capture an authorized payment — only for auth+capture gateways */
  captureSession?(sessionId: string, amount?: number): Promise<PaymentSession>

  /** Cancel/void a pending or authorized session */
  cancelSession?(sessionId: string): Promise<PaymentSession>

  /** Verify webhook signature and parse event (server-side only) */
  verifyWebhook?(payload: string | Uint8Array, signature: string): Promise<PaymentWebhookEvent>
}
