// ---------------------------------------------------------------------------
// TapPaymentProvider — Tap Payments gateway (redirect-based, PCI-free)
// ---------------------------------------------------------------------------
//
// Flow: tokenize client-side (goSell.js) → create charge server-side →
//       redirect for 3DS → confirm after redirect → done.
//
// Tap auto-captures charges, so captureSession is not implemented.
// ---------------------------------------------------------------------------

import type {
  PaymentProvider,
  PaymentSession,
  PaymentSessionStatus,
  CreatePaymentSessionInput,
  RefundInput,
  PaymentWebhookEvent,
} from '@commercejs/types'

import type { TapConfig, TapRawCharge, TapChargeStatus } from './types.js'

const TAP_API_BASE = 'https://api.tap.company/v2'

/** Map Tap charge status → PaymentSessionStatus */
function mapTapStatus(status: TapChargeStatus): PaymentSessionStatus {
  switch (status) {
    case 'INITIATED':
      return 'pending'
    case 'IN_PROGRESS':
      return 'processing'
    case 'CAPTURED':
      return 'captured'
    case 'VOID':
    case 'CANCELLED':
    case 'TIMEDOUT':
    case 'ABANDONED':
      return 'cancelled'
    case 'FAILED':
    case 'DECLINED':
    case 'RESTRICTED':
      return 'failed'
    case 'REFUNDED':
      return 'refunded'
    default:
      return 'pending'
  }
}

/** Build a PaymentSession from a Tap charge */
function chargeToSession(charge: TapRawCharge, providerId: string): PaymentSession {
  return {
    id: charge.id,
    providerId,
    status: mapTapStatus(charge.status),
    amount: charge.amount,
    currency: charge.currency,
    providerData: {
      tapChargeId: charge.id,
      tapStatus: charge.status,
      source: charge.source,
      reference: charge.reference,
    },
    redirectUrl: charge.transaction?.url ?? null,
    createdAt: charge.created ?? new Date().toISOString(),
  }
}

/**
 * Tap Payments provider — redirect-based, PCI-free.
 *
 * @example
 * ```ts
 * const tap = new TapPaymentProvider({ secretKey: 'sk_test_...' })
 *
 * // 1. Create charge with token from goSell.js
 * const session = await tap.createSession({
 *   amount: 99.99,
 *   currency: 'SAR',
 *   sourceToken: 'tok_xxx',
 *   returnUrl: 'https://store.com/checkout/confirm',
 * })
 *
 * // 2. Redirect customer to session.redirectUrl for 3DS
 *
 * // 3. After redirect, confirm the payment
 * const confirmed = await tap.confirmSession(session.id)
 * // confirmed.status === 'captured'
 * ```
 */
export class TapPaymentProvider implements PaymentProvider {
  readonly id = 'tap'
  readonly name = 'Tap Payments'

  private readonly secretKey: string
  private readonly baseUrl: string
  private readonly webhookSecret: string | null

  constructor(config: TapConfig) {
    this.secretKey = config.secretKey
    this.baseUrl = config.baseUrl ?? TAP_API_BASE
    this.webhookSecret = config.webhookSecret ?? null
  }

  // ---------------------------------------------------------------------------
  // Core methods (required by PaymentProvider)
  // ---------------------------------------------------------------------------

  async createSession(input: CreatePaymentSessionInput): Promise<PaymentSession> {
    const body: Record<string, unknown> = {
      amount: input.amount,
      currency: input.currency,
      threeDSecure: true,
      source: { id: input.sourceToken ?? 'src_all' },
      redirect: { url: input.returnUrl ?? '' },
      ...(input.orderId ? { reference: { order: input.orderId } } : {}),
      ...(input.customerId ? { customer: { id: input.customerId } } : {}),
      // Include customer details if provided (and no customerId)
      ...(!input.customerId && input.customer
        ? {
            customer: {
              first_name: input.customer.firstName ?? '',
              last_name: input.customer.lastName ?? '',
              email: input.customer.email ?? '',
              phone: input.customer.phone
                ? { country_code: '966', number: input.customer.phone.replace(/^\+?966\s?/, '') }
                : undefined,
            },
          }
        : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      // Tap sends charge results to this URL asynchronously
      ...(input.webhookUrl ? { post: { url: input.webhookUrl } } : {}),
    }

    const charge = await this.request<TapRawCharge>('POST', '/charges', body)
    return chargeToSession(charge, this.id)
  }

  async confirmSession(sessionId: string): Promise<PaymentSession> {
    // After 3DS redirect, re-fetch the charge to get the final status
    return this.getSession(sessionId)
  }

  async getSession(sessionId: string): Promise<PaymentSession> {
    const charge = await this.request<TapRawCharge>('GET', `/charges/${sessionId}`)
    return chargeToSession(charge, this.id)
  }

  async refund(input: RefundInput): Promise<PaymentSession> {
    // First get the current charge to know the amount/currency
    const current = await this.getSession(input.sessionId)

    await this.request('POST', '/refunds', {
      charge_id: input.sessionId,
      amount: input.amount ?? current.amount,
      currency: current.currency,
      reason: input.reason ?? 'requested_by_customer',
    })

    // Re-fetch to get updated status
    return this.getSession(input.sessionId)
  }

  // ---------------------------------------------------------------------------
  // Optional methods
  // ---------------------------------------------------------------------------

  async cancelSession(sessionId: string): Promise<PaymentSession> {
    // Tap doesn't have a dedicated cancel endpoint.
    // For authorized (not captured) transactions, we could void.
    // For now, re-fetch and return current state.
    return this.getSession(sessionId)
  }

  async verifyWebhook(payload: string | Uint8Array, signature: string): Promise<PaymentWebhookEvent> {
    // Tap's webhook verification uses a "hashstring" — NOT raw body HMAC.
    // The hashstring is built by concatenating specific fields from the charge
    // body with x_ prefixes, then HMAC-SHA256'd with the secret API key.
    //
    // Format for charges/authorizes:
    //   x_id{id}x_amount{amount}x_currency{currency}x_gateway_reference{ref}
    //   x_payment_reference{ref}x_status{status}x_created{created}
    //
    // See: https://developers.tap.company/docs/webhook#validate-the-webhook-hashstring

    const bodyStr = typeof payload === 'string' ? payload : new TextDecoder().decode(payload)
    const event = JSON.parse(bodyStr)

    // Extract fields for hashstring
    const id = event.id ?? ''
    const amount = event.amount ?? ''
    const currency = event.currency ?? ''
    const gatewayRef = event.reference?.gateway ?? ''
    const paymentRef = event.reference?.payment ?? ''
    const status = event.status ?? ''
    const created = event.transaction?.created ?? ''

    // Build the hashstring input
    const toBeHashed =
      `x_id${id}` +
      `x_amount${amount}` +
      `x_currency${currency}` +
      `x_gateway_reference${gatewayRef}` +
      `x_payment_reference${paymentRef}` +
      `x_status${status}` +
      `x_created${created}`

    // HMAC-SHA256 with the secret API key
    const encoder = new TextEncoder()
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sig = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(toBeHashed))
    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (computed !== signature) {
      throw new Error('TapPaymentProvider: invalid webhook hashstring')
    }

    // Map Tap status to a normalized event type
    const eventType = this.mapChargeStatusToEventType(event.status)

    return {
      type: eventType,
      sessionId: String(event.id ?? ''),
      data: event,
    }
  }

  /** Map Tap charge status to a webhook event type */
  private mapChargeStatusToEventType(status: TapChargeStatus): string {
    switch (status) {
      case 'CAPTURED': return 'payment.captured'
      case 'FAILED':
      case 'DECLINED':
      case 'RESTRICTED': return 'payment.failed'
      case 'VOID':
      case 'CANCELLED': return 'payment.cancelled'
      case 'REFUNDED': return 'payment.refunded'
      case 'TIMEDOUT':
      case 'ABANDONED': return 'payment.expired'
      default: return 'payment.updated'
    }
  }

  // ---------------------------------------------------------------------------
  // HTTP helper
  // ---------------------------------------------------------------------------

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    const res = await fetch(url, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`Tap API error (${res.status}): ${errorBody}`)
    }

    return res.json() as Promise<T>
  }
}
