// ---------------------------------------------------------------------------
// CheckoutSession — universal checkout state machine
// ---------------------------------------------------------------------------
//
// Pure TypeScript, zero framework deps. Works in Node, Edge, or browser.
//
// State machine (fulfillment = shipping/local_delivery):
//   idle → info → shipping → payment → confirming → complete
//                                          ↓
//                                       failed → payment (retry)
//
// State machine (fulfillment = pickup/none):
//   idle → info → payment → confirming → complete
//                               ↓
//                            failed → payment (retry)
// ---------------------------------------------------------------------------

import type { Address, PaymentProvider, PaymentSession } from '@commercejs/types'
import { EventEmitter } from './events.js'
import type {
  CheckoutState,
  CheckoutSessionConfig,
  CheckoutCustomerInfo,
  CheckoutSnapshot,
  CheckoutEvents,
  ResolvedCheckoutConfig,
  CheckoutChannel,
  CheckoutFulfillment,
} from './types.js'
import { buildTransitions } from './types.js'

// ---------------------------------------------------------------------------
// Config resolution (Options → ResolvedOptions pattern)
// ---------------------------------------------------------------------------

function resolveConfig(config: CheckoutSessionConfig): ResolvedCheckoutConfig {
  const channel: CheckoutChannel = config.channel ?? 'web'
  const fulfillment: CheckoutFulfillment = config.fulfillment ?? (channel === 'web' ? 'shipping' : 'none')

  return {
    paymentProvider: config.paymentProvider,
    currency: config.currency,
    amount: config.amount,
    returnUrl: config.returnUrl ?? null,
    cancelUrl: config.cancelUrl ?? null,
    orderId: config.orderId ?? null,
    webhookUrl: config.webhookUrl ?? null,
    channel,
    fulfillment,
    expiresAt: config.expiresIn ? Date.now() + config.expiresIn : null,
  }
}

// ---------------------------------------------------------------------------
// CheckoutSession
// ---------------------------------------------------------------------------

/**
 * Universal checkout session — a state machine that orchestrates the
 * checkout flow from customer info through payment and confirmation.
 *
 * Framework-agnostic: use it in a Nuxt app, a React app, a CLI, or
 * directly on the server.
 *
 * @example Web checkout (full flow with shipping)
 * ```ts
 * const session = new CheckoutSession({
 *   paymentProvider: new TapPaymentProvider({ secretKey: 'sk_test_...' }),
 *   currency: 'SAR',
 *   amount: 199.99,
 *   returnUrl: 'https://mystore.com/confirm',
 * })
 *
 * session.setCustomerInfo({ email: 'ali@example.com', firstName: 'Ali' })
 * session.setShippingAddress({ street: '...', city: 'Riyadh', ... })
 * session.setShippingMethod('standard')
 * await session.submitPayment({ sourceToken: 'tok_xxx' })
 * ```
 *
 * @example POS checkout (payment only, no address)
 * ```ts
 * const session = new CheckoutSession({
 *   paymentProvider: tapProvider,
 *   currency: 'SAR',
 *   amount: 45.00,
 *   channel: 'pos',
 *   // fulfillment defaults to 'none' for POS
 * })
 *
 * session.setCustomerInfo({ email: 'walk-in@pos.local' })
 * await session.submitPayment()
 * ```
 *
 * @example Restaurant with delivery
 * ```ts
 * const session = new CheckoutSession({
 *   paymentProvider: tapProvider,
 *   currency: 'SAR',
 *   amount: 85.00,
 *   channel: 'link',
 *   fulfillment: 'local_delivery', // needs address, no method selection
 * })
 * ```
 */
export class CheckoutSession extends EventEmitter<CheckoutEvents> {
  // --- Internal state ---
  private _state: CheckoutState = 'idle'
  private _customerInfo: CheckoutCustomerInfo | null = null
  private _shippingAddress: Omit<Address, 'id' | 'isDefault'> | null = null
  private _billingAddress: Omit<Address, 'id' | 'isDefault'> | null = null
  private _shippingMethodId: string | null = null
  private _paymentSession: PaymentSession | null = null
  private _error: Error | null = null

  // --- Resolved config ---
  private readonly _config: ResolvedCheckoutConfig
  private readonly provider: PaymentProvider
  private readonly _transitions: Record<CheckoutState, readonly CheckoutState[]>
  private _amount: number
  private _currency: string

  constructor(config: CheckoutSessionConfig) {
    super()
    this._config = resolveConfig(config)
    this.provider = this._config.paymentProvider
    this._amount = this._config.amount
    this._currency = this._config.currency
    this._transitions = buildTransitions(this._config.fulfillment)
  }

  // ---------------------------------------------------------------------------
  // Public getters (read-only)
  // ---------------------------------------------------------------------------

  get state(): CheckoutState { return this._state }
  get customerInfo(): CheckoutCustomerInfo | null { return this._customerInfo }
  get shippingAddress(): Omit<Address, 'id' | 'isDefault'> | null { return this._shippingAddress }
  get billingAddress(): Omit<Address, 'id' | 'isDefault'> | null { return this._billingAddress }
  get shippingMethodId(): string | null { return this._shippingMethodId }
  get paymentSession(): PaymentSession | null { return this._paymentSession }
  get amount(): number { return this._amount }
  get currency(): string { return this._currency }
  get orderId(): string | null { return this._config.orderId }
  get channel(): CheckoutChannel { return this._config.channel }
  get fulfillment(): CheckoutFulfillment { return this._config.fulfillment }
  get error(): Error | null { return this._error }

  // ---------------------------------------------------------------------------
  // State transitions
  // ---------------------------------------------------------------------------

  /**
   * Set customer info and transition to `info` state.
   * Must be in `idle` state.
   */
  setCustomerInfo(info: CheckoutCustomerInfo): void {
    this.assertNotExpired()
    this.assertTransition('info')
    this._customerInfo = info
    this.transition('info')
  }

  /**
   * Set shipping address and transition to `shipping` state.
   * Must be in `info` state.
   * Optionally set billing address (defaults to shipping address).
   *
   * Only available when fulfillment requires an address (shipping, local_delivery).
   */
  setShippingAddress(
    address: Omit<Address, 'id' | 'isDefault'>,
    billingAddress?: Omit<Address, 'id' | 'isDefault'>,
  ): void {
    this.assertNotExpired()
    this.assertTransition('shipping')
    this._shippingAddress = address
    this._billingAddress = billingAddress ?? address
    this.transition('shipping')
  }

  /**
   * Set shipping method.
   * Can be called while in `shipping` state (does not transition — call
   * `submitPayment` when ready to move to `payment`).
   */
  setShippingMethod(methodId: string): void {
    if (this._state !== 'shipping') {
      throw new Error(`Cannot set shipping method in "${this._state}" state`)
    }
    this._shippingMethodId = methodId
  }

  /**
   * Update the order amount. Can be called before payment is submitted.
   */
  setAmount(amount: number): void {
    if (this._state === 'confirming' || this._state === 'complete') {
      throw new Error(`Cannot update amount in "${this._state}" state`)
    }
    this._amount = amount
  }

  /**
   * Set order ID (if not provided at construction time).
   */
  setOrderId(orderId: string): void {
    (this._config as { orderId: string | null }).orderId = orderId
  }

  // ---------------------------------------------------------------------------
  // Payment flow
  // ---------------------------------------------------------------------------

  /**
   * Submit payment — creates a payment session with the provider.
   *
   * Valid from:
   * - `shipping` or `failed` (retry) when fulfillment requires address
   * - `info`, `shipping`, or `failed` when fulfillment is pickup/none
   *
   * @param options - Optional overrides for the payment session
   * @returns The payment session (may include a redirectUrl for 3DS)
   */
  async submitPayment(options: {
    sourceToken?: string
    idempotencyKey?: string
    saveCard?: boolean
    customerId?: string
    metadata?: Record<string, unknown>
  } = {}): Promise<PaymentSession> {
    this.assertNotExpired()

    // Determine valid source states based on fulfillment
    const validStates: CheckoutState[] = ['shipping', 'failed']
    if (this._config.fulfillment === 'pickup' || this._config.fulfillment === 'none') {
      validStates.push('info')
    }

    if (!validStates.includes(this._state)) {
      throw new Error(`Cannot submit payment in "${this._state}" state`)
    }

    this._error = null

    try {
      const session = await this.provider.createSession({
        amount: this._amount,
        currency: this._currency,
        sourceToken: options.sourceToken,
        idempotencyKey: options.idempotencyKey,
        orderId: this._config.orderId ?? undefined,
        customerId: options.customerId ?? undefined,
        customer: this._customerInfo
          ? {
              email: this._customerInfo.email,
              firstName: this._customerInfo.firstName,
              lastName: this._customerInfo.lastName,
              phone: this._customerInfo.phone,
            }
          : undefined,
        returnUrl: this._config.returnUrl ?? undefined,
        cancelUrl: this._config.cancelUrl ?? undefined,
        webhookUrl: this._config.webhookUrl ?? undefined,
        saveCard: options.saveCard,
        metadata: options.metadata,
      })

      this._paymentSession = session

      // If payment is already captured (no 3DS needed), go straight to complete
      if (session.status === 'captured') {
        this.transition('confirming')
        this.transition('complete')
        this.emit('complete', { paymentSession: session })
        return session
      }

      // If there's a redirect URL, customer needs to complete 3DS
      if (session.redirectUrl) {
        this.transition('payment')
        this.emit('paymentAction', { redirectUrl: session.redirectUrl })
        return session
      }

      // If payment was instantly declined (no 3DS), fail immediately
      if (session.status === 'failed' || session.status === 'cancelled') {
        const error = new Error(`Payment ${session.status}`)
        this._error = error
        this.transition('failed')
        this.emit('error', { error, state: this._state })
        throw error
      }

      // If pending/processing, wait for confirmation
      this.transition('payment')
      return session
    }
    catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this._error = error
      // Only transition to failed if not already there
      if (this._state !== 'failed') {
        this.transition('failed')
      }
      this.emit('error', { error, state: this._state })
      throw error
    }
  }

  /**
   * Confirm payment after 3DS redirect or async completion.
   * Must be in `payment` state.
   *
   * @param sessionId - The payment session ID to confirm (from redirect params)
   * @returns The confirmed payment session
   */
  async confirmPayment(sessionId?: string): Promise<PaymentSession> {
    this.assertNotExpired()

    if (this._state !== 'payment') {
      throw new Error(`Cannot confirm payment in "${this._state}" state`)
    }

    const id = sessionId ?? this._paymentSession?.id
    if (!id) {
      throw new Error('No payment session ID available for confirmation')
    }

    this.transition('confirming')

    try {
      const confirmed = await this.provider.confirmSession(id)
      this._paymentSession = confirmed

      if (confirmed.status === 'captured') {
        this.transition('complete')
        this.emit('complete', { paymentSession: confirmed })
        return confirmed
      }

      if (confirmed.status === 'failed' || confirmed.status === 'cancelled') {
        const error = new Error(`Payment ${confirmed.status}`)
        this._error = error
        this.transition('failed')
        this.emit('error', { error, state: this._state })
        throw error
      }

      // Still processing — caller should poll or wait for webhook
      return confirmed
    }
    catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this._error = error
      this.transition('failed')
      this.emit('error', { error, state: this._state })
      throw error
    }
  }

  /**
   * Handle an async webhook update from the payment provider.
   *
   * Unlike `confirmPayment`, this is for trusted server-side events and
   * works from any non-terminal state. It directly transitions to
   * `complete` or `failed` based on the payment status.
   *
   * @param paymentSession - The updated payment session from the webhook
   */
  handleWebhookUpdate(paymentSession: PaymentSession): void {
    // Don't update terminal states
    if (this._state === 'complete') return
    // Allow re-processing failed state (idempotent)

    this._paymentSession = paymentSession

    if (paymentSession.status === 'captured') {
      // Skip through intermediate states directly to complete
      if (this._state !== 'confirming') {
        this._state = 'confirming' as CheckoutState
      }
      this.transition('complete')
      this.emit('complete', { paymentSession })
    }
    else if (
      paymentSession.status === 'failed' ||
      paymentSession.status === 'cancelled'
    ) {
      const error = new Error(`Payment ${paymentSession.status} (webhook)`)
      this._error = error
      // Force to failed regardless of current state
      if (this._state !== 'failed') {
        this._state = 'payment' as CheckoutState // ensure valid transition source
        this.transition('failed')
      }
      this.emit('error', { error, state: this._state })
    }
    // For pending/processing — just update the payment session data
  }

  // ---------------------------------------------------------------------------
  // Snapshot (for serialization / SSR hydration)
  // ---------------------------------------------------------------------------

  /** Get a serializable snapshot of the current session state */
  toSnapshot(): CheckoutSnapshot {
    return {
      state: this._state,
      channel: this._config.channel,
      fulfillment: this._config.fulfillment,
      expiresAt: this._config.expiresAt
        ? new Date(this._config.expiresAt).toISOString()
        : null,
      customerInfo: this._customerInfo,
      shippingAddress: this._shippingAddress,
      billingAddress: this._billingAddress,
      shippingMethodId: this._shippingMethodId,
      paymentSession: this._paymentSession,
      amount: this._amount,
      currency: this._currency,
      orderId: this._config.orderId,
      error: this._error?.message ?? null,
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  /** Transition to a new state, emit stateChange event */
  private transition(to: CheckoutState): void {
    const from = this._state
    this._state = to
    this.emit('stateChange', { from, to })
  }

  /** Assert that a transition is valid, throw if not */
  private assertTransition(to: CheckoutState): void {
    const allowed = this._transitions[this._state]
    if (!allowed.includes(to)) {
      throw new Error(
        `Invalid transition: "${this._state}" → "${to}". ` +
        `Allowed: [${allowed.join(', ')}]`,
      )
    }
  }

  /** Assert that the session has not expired */
  private assertNotExpired(): void {
    if (this._config.expiresAt && Date.now() > this._config.expiresAt) {
      this.emit('expired', {})
      throw new Error('Checkout session has expired')
    }
  }
}
