# Payment Integration

> How to add a new payment provider to CommerceJS.

CommerceJS uses a pluggable payment architecture. Adding a new provider — Stripe, PayPal, or a custom gateway — requires implementing the `PaymentProvider` interface from `@commercejs/types`.

## The PaymentProvider Interface

Every payment provider implements four methods:

```ts
interface PaymentProvider {
  createSession(input: CreatePaymentSessionInput): Promise<PaymentSession>
  confirmSession(sessionId: string): Promise<PaymentSession>
  refund(input: RefundInput): Promise<PaymentSession>
  verifyWebhook(event: PaymentWebhookEvent): Promise<boolean>
}
```

## Step-by-Step Guide

<steps>

### Create the package

Create a new package in the monorepo:

```bash
mkdir -p packages/payment-stripe/src
```

```json [packages/payment-stripe/package.json]
{
  "name": "@commercejs/payment-stripe",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@commercejs/types": "workspace:*"
  }
}
```

### Implement the provider

Create the provider class that implements `PaymentProvider`:

```ts [packages/payment-stripe/src/stripe-provider.ts]
import type {
  PaymentProvider,
  PaymentSession,
  CreatePaymentSessionInput,
  RefundInput,
  PaymentWebhookEvent,
} from '@commercejs/types'

export class StripePaymentProvider implements PaymentProvider {
  private secretKey: string

  constructor(config: { secretKey: string }) {
    this.secretKey = config.secretKey
  }

  async createSession(input: CreatePaymentSessionInput): Promise<PaymentSession> {
    // Call Stripe's API to create a PaymentIntent
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(Math.round(input.amount * 100)),
        currency: input.currency.toLowerCase(),
        'payment_method': input.sourceToken!,
        confirm: 'true',
        'return_url': input.returnUrl!,
      }),
    })

    const intent = await response.json()

    return {
      id: intent.id,
      providerId: 'stripe',
      status: this.mapStatus(intent.status),
      amount: input.amount,
      currency: input.currency,
      redirectUrl: intent.next_action?.redirect_to_url?.url ?? null,
      createdAt: new Date().toISOString(),
    }
  }

  async confirmSession(sessionId: string): Promise<PaymentSession> {
    // Retrieve the PaymentIntent to check its status
    const response = await fetch(
      `https://api.stripe.com/v1/payment_intents/${sessionId}`,
      { headers: { 'Authorization': `Bearer ${this.secretKey}` } },
    )
    const intent = await response.json()

    return {
      id: intent.id,
      providerId: 'stripe',
      status: this.mapStatus(intent.status),
      amount: intent.amount / 100,
      currency: intent.currency.toUpperCase(),
      redirectUrl: null,
      createdAt: new Date(intent.created * 1000).toISOString(),
    }
  }

  async refund(input: RefundInput): Promise<PaymentSession> {
    // Create a Stripe refund
    throw new Error('Not implemented')
  }

  async verifyWebhook(event: PaymentWebhookEvent): Promise<boolean> {
    // Verify Stripe webhook signature
    throw new Error('Not implemented')
  }

  private mapStatus(stripeStatus: string): PaymentSession['status'] {
    switch (stripeStatus) {
      case 'succeeded': return 'captured'
      case 'requires_action': return 'requires_action'
      case 'requires_payment_method': return 'failed'
      case 'canceled': return 'cancelled'
      case 'processing': return 'processing'
      default: return 'pending'
    }
  }
}
```

### Export the provider

```ts [packages/payment-stripe/src/index.ts]
export { StripePaymentProvider } from './stripe-provider.js'
```

### Use it with CheckoutSession

```ts
import { CheckoutSession } from '@commercejs/checkout'
import { StripePaymentProvider } from '@commercejs/payment-stripe'

const session = new CheckoutSession({
  provider: new StripePaymentProvider({
    secretKey: process.env.STRIPE_SECRET_KEY!,
  }),
  amount: 49.99,
  currency: 'USD',
})
```

</steps>

## Status Mapping

Map your provider's statuses to `PaymentSessionStatus`:

<table>
<thead>
  <tr>
    <th>
      PaymentSessionStatus
    </th>
    
    <th>
      Meaning
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        pending
      </code>
    </td>
    
    <td>
      Payment created, not yet processed
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        processing
      </code>
    </td>
    
    <td>
      Payment is being processed
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        requires_action
      </code>
    </td>
    
    <td>
      Customer action needed (3DS, redirect)
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        captured
      </code>
    </td>
    
    <td>
      Payment captured successfully
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        failed
      </code>
    </td>
    
    <td>
      Payment failed or declined
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        cancelled
      </code>
    </td>
    
    <td>
      Payment cancelled
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        refunded
      </code>
    </td>
    
    <td>
      Payment refunded
    </td>
  </tr>
</tbody>
</table>

## Webhook Verification

Add a webhook verifier config for your provider:

```ts [packages/payment-stripe/src/webhook-config.ts]
export const stripeWebhookConfig = {
  formatter: (body: any) => `${body.id}.${body.created}`,
  algorithm: 'hmac-sha256' as const,
  getExpectedSignature: (headers: Record<string, string>) => {
    const sigHeader = headers['stripe-signature'] ?? ''
    const parts = sigHeader.split(',')
    const sig = parts.find(p => p.startsWith('v1='))
    return sig?.replace('v1=', '') ?? null
  },
}
```

<tip>

See `@commercejs/payment-tap` for a complete, production-ready implementation to use as a reference.

</tip>
