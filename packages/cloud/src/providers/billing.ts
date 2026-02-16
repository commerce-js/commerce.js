// ---------------------------------------------------------------------------
// Billing Provider — Tap Payments (GCC) + Stripe (international)
// ---------------------------------------------------------------------------

import { ofetch, type $Fetch } from 'ofetch'
import type { BillingConfig } from '../types.js'

const TAP_API_BASE = 'https://api.tap.company/v2'
const STRIPE_API_BASE = 'https://api.stripe.com/v1'

type BillingRegion = 'gcc' | 'international'

/**
 * Billing provider for CommerceJS Cloud.
 *
 * Dual-provider strategy:
 * - **Tap Payments** for GCC countries (SAR, AED, KWD, BHD, OMR, QAR)
 * - **Stripe** for international markets (USD, EUR, GBP, etc.)
 *
 * Auto-selects provider based on merchant region/currency.
 */
export class BillingProvider {
  private tapClient?: $Fetch
  private stripeClient?: $Fetch
  private defaultRegion: BillingRegion

  /** GCC currencies handled by Tap Payments */
  private static GCC_CURRENCIES = new Set([
    'SAR', 'AED', 'KWD', 'BHD', 'OMR', 'QAR', 'EGP', 'JOD',
  ])

  constructor(config: BillingConfig) {
    this.defaultRegion = config.defaultRegion ?? 'gcc'

    if (config.tapSecretKey) {
      this.tapClient = ofetch.create({
        baseURL: TAP_API_BASE,
        headers: {
          Authorization: `Bearer ${config.tapSecretKey}`,
          'Content-Type': 'application/json',
        },
      })
    }

    if (config.stripeSecretKey) {
      this.stripeClient = ofetch.create({
        baseURL: STRIPE_API_BASE,
        headers: {
          Authorization: `Bearer ${config.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    }
  }

  /**
   * Determine which billing provider to use based on currency.
   */
  resolveProvider(currency?: string): BillingRegion {
    if (currency && BillingProvider.GCC_CURRENCIES.has(currency.toUpperCase())) {
      return 'gcc'
    }
    return currency ? 'international' : this.defaultRegion
  }

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------

  /**
   * Create a subscription for a Cloud project.
   */
  async createSubscription(options: {
    customerId: string
    plan: 'starter' | 'pro' | 'enterprise'
    currency?: string
  }): Promise<{
    subscriptionId: string
    provider: BillingRegion
    status: string
  }> {
    const provider = this.resolveProvider(options.currency)

    if (provider === 'gcc') {
      return this.createTapSubscription(options)
    }
    return this.createStripeSubscription(options)
  }

  private async createTapSubscription(options: {
    customerId: string
    plan: string
  }): Promise<{ subscriptionId: string; provider: BillingRegion; status: string }> {
    if (!this.tapClient) throw new Error('Tap Payments not configured')

    const response = await this.tapClient<any>('/recurring', {
      method: 'POST',
      body: {
        term: { interval: 'MONTHLY', period: 1 },
        customer: { id: options.customerId },
        // Plan mapping would come from config
      },
    })

    return {
      subscriptionId: response.id,
      provider: 'gcc',
      status: response.status,
    }
  }

  private async createStripeSubscription(options: {
    customerId: string
    plan: string
  }): Promise<{ subscriptionId: string; provider: BillingRegion; status: string }> {
    if (!this.stripeClient) throw new Error('Stripe not configured')

    const response = await this.stripeClient<any>('/subscriptions', {
      method: 'POST',
      body: new URLSearchParams({
        customer: options.customerId,
        // Price ID mapping would come from config
      }).toString(),
    })

    return {
      subscriptionId: response.id,
      provider: 'international',
      status: response.status,
    }
  }

  // ---------------------------------------------------------------------------
  // Checkout Sessions
  // ---------------------------------------------------------------------------

  /**
   * Create a checkout session for plan signup.
   */
  async createCheckoutSession(options: {
    plan: 'starter' | 'pro' | 'enterprise'
    currency?: string
    successUrl: string
    cancelUrl: string
  }): Promise<{
    checkoutUrl: string
    provider: BillingRegion
  }> {
    const provider = this.resolveProvider(options.currency)

    if (provider === 'gcc') {
      return this.createTapCheckout(options)
    }
    return this.createStripeCheckout(options)
  }

  private async createTapCheckout(options: {
    plan: string
    successUrl: string
    cancelUrl: string
  }): Promise<{ checkoutUrl: string; provider: BillingRegion }> {
    if (!this.tapClient) throw new Error('Tap Payments not configured')

    const response = await this.tapClient<any>('/charges', {
      method: 'POST',
      body: {
        redirect: { url: options.successUrl },
        post: { url: options.cancelUrl },
      },
    })

    return {
      checkoutUrl: response.transaction?.url ?? '',
      provider: 'gcc',
    }
  }

  private async createStripeCheckout(options: {
    plan: string
    successUrl: string
    cancelUrl: string
  }): Promise<{ checkoutUrl: string; provider: BillingRegion }> {
    if (!this.stripeClient) throw new Error('Stripe not configured')

    const response = await this.stripeClient<any>('/checkout/sessions', {
      method: 'POST',
      body: new URLSearchParams({
        mode: 'subscription',
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
      }).toString(),
    })

    return {
      checkoutUrl: response.url,
      provider: 'international',
    }
  }
}
