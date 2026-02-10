# @commercejs/payment-tap

Tap Payments provider for CommerceJS — redirect-based, PCI-free.

[![npm](https://img.shields.io/npm/v/@commercejs/payment-tap?color=CB3837)](https://www.npmjs.com/package/@commercejs/payment-tap)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@commercejs/payment-tap` implements the `PaymentProvider` interface from `@commercejs/types` for [Tap Payments](https://www.tap.company/). It supports redirect-based checkout (3DS), refunds, and charge retrieval — all without handling raw card data (PCI-free).

## Install

```bash
npm install @commercejs/payment-tap @commercejs/types
```

## Quick Start

### With CheckoutSession

```typescript
import { CheckoutSession } from '@commercejs/checkout'
import { TapPaymentProvider } from '@commercejs/payment-tap'

const provider = new TapPaymentProvider({
  secretKey: process.env.TAP_SECRET_KEY!,
  publishableKey: process.env.TAP_PUBLISHABLE_KEY!,
})

const session = new CheckoutSession({ provider, amount: 100, currency: 'SAR' })
```

### Standalone

```typescript
import { TapPaymentProvider } from '@commercejs/payment-tap'

const tap = new TapPaymentProvider({
  secretKey: process.env.TAP_SECRET_KEY!,
  publishableKey: process.env.TAP_PUBLISHABLE_KEY!,
})

// Create a payment session
const session = await tap.createSession({
  amount: 250,
  currency: 'SAR',
  customer: { email: 'customer@example.com' },
  returnUrl: 'https://mystore.com/checkout/callback',
})

// Redirect customer to session.redirectUrl for 3DS

// After redirect, verify the payment
const verified = await tap.getSession(session.id)
console.log(verified.status) // 'paid' | 'failed' | 'pending'

// Process a refund
const refund = await tap.refund({
  sessionId: session.id,
  amount: 50,
  reason: 'Customer request',
})
```

## Configuration

```typescript
interface TapConfig {
  /** Tap secret key (sk_live_xxx or sk_test_xxx) */
  secretKey: string
  /** Tap publishable key (pk_live_xxx or pk_test_xxx) */
  publishableKey: string
}
```

## Exports

| Export | Description |
|--------|-------------|
| `TapPaymentProvider` | Main provider class implementing `PaymentProvider` |
| `TapConfig` | Configuration type |
| `TapRawCharge` | Raw Tap charge object type |
| `TapChargeStatus` | Tap charge status enum |
| `TapRawRefund` | Raw Tap refund object type |

## Documentation

Full docs at [commerce.js.org](https://commerce.js.org)

## License

[MIT](../../LICENSE)
