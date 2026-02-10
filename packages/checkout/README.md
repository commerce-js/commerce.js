# @commercejs/checkout

Universal checkout engine — a framework-agnostic state machine for payment flows.

[![npm](https://img.shields.io/npm/v/@commercejs/checkout?color=CB3837)](https://www.npmjs.com/package/@commercejs/checkout)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@commercejs/checkout` provides a `CheckoutSession` class that manages the entire checkout lifecycle — from collecting customer info to processing payments and handling 3DS redirects. It works in any JavaScript runtime: Nuxt, React, Node.js, Edge, or the browser.

## Install

```bash
npm install @commercejs/checkout @commercejs/types
```

## Quick Start

```typescript
import { CheckoutSession } from '@commercejs/checkout'
import { TapPaymentProvider } from '@commercejs/payment-tap'

// Create a session with a payment provider
const session = new CheckoutSession({
  provider: new TapPaymentProvider({
    secretKey: process.env.TAP_SECRET_KEY!,
    publishableKey: process.env.TAP_PUBLISHABLE_KEY!,
  }),
  amount: 250,
  currency: 'SAR',
  orderId: 'order_123',
})

// Listen for events
session.on('stateChange', ({ from, to }) => {
  console.log(`${from} → ${to}`)
})

session.on('complete', ({ session: paymentSession }) => {
  console.log('Payment complete!', paymentSession.id)
})

session.on('error', ({ error }) => {
  console.error('Payment failed:', error.message)
})

// Drive the checkout flow
session.setCustomerInfo({ email: 'customer@example.com', firstName: 'Ali' })
session.setShippingAddress({ street: '123 Main St', city: 'Riyadh', country: 'SA' })
session.setShippingMethod('standard')

const payment = await session.submitPayment({ sourceToken: 'tok_xxx' })

if (payment.redirectUrl) {
  // Redirect customer for 3DS verification
  window.location.href = payment.redirectUrl
}
```

## State Machine

The checkout follows a strict state machine with these transitions:

```
idle → info → shipping → payment → complete
                  ↓                    ↑
                  └──── failed ────────┘
                           ↑
                        (retry)
```

| State | Description |
|-------|-------------|
| `idle` | Initial state, waiting for customer info |
| `info` | Customer info collected |
| `shipping` | Shipping address set, ready for payment |
| `payment` | Payment submitted, waiting for confirmation |
| `complete` | Payment confirmed, checkout done |
| `failed` | Payment failed (can retry from here) |

## API

### `CheckoutSession`

| Method | Description |
|--------|-------------|
| `setCustomerInfo(info)` | Set customer email, name, phone |
| `setShippingAddress(address, billing?)` | Set shipping and optional billing address |
| `setShippingMethod(methodId)` | Select a shipping method |
| `setAmount(amount)` | Update order amount |
| `setOrderId(orderId)` | Set or update order ID |
| `submitPayment(options?)` | Create payment session with provider |
| `confirmPayment(sessionId?)` | Confirm after 3DS redirect |
| `handleWebhookUpdate(session)` | Process async webhook events |
| `toSnapshot()` | Get serializable state snapshot |

### Events

| Event | Payload |
|-------|---------|
| `stateChange` | `{ from, to }` |
| `complete` | `{ session }` |
| `error` | `{ error, state }` |

## Documentation

Full docs at [commerce.js.org](https://commerce.js.org)

## License

[MIT](../../LICENSE)
