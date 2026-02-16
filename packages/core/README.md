# @commercejs/core

Unified Commerce Orchestration Engine — `createCommerce()` wires adapters, payments, events, and webhooks into a single entry point.

[![npm](https://img.shields.io/npm/v/@commercejs/core?color=CB3837)](https://www.npmjs.com/package/@commercejs/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@commercejs/core` is the orchestration layer that ties the CommerceJS ecosystem together. It takes a `CommerceAdapter` and optional payment providers, notification providers, and analytics providers — then exposes a single API surface for all commerce operations. Events are emitted automatically, webhooks are dispatched, and domain calls are capability-checked at runtime.

## Install

```bash
npm install @commercejs/core @commercejs/types
```

## Quick Start

```typescript
import { createCommerce } from '@commercejs/core'
import { createSallaAdapter } from '@commercejs/adapter-salla'
import { TapPaymentProvider } from '@commercejs/payment-tap'

const commerce = createCommerce({
  adapter: createSallaAdapter({ accessToken: process.env.SALLA_TOKEN! }),
  payments: {
    tap: new TapPaymentProvider({
      secretKey: process.env.TAP_SECRET_KEY!,
      publishableKey: process.env.TAP_PUBLISHABLE_KEY!,
    }),
  },
  defaultPayment: 'tap',
})

// Capability-checked calls
const products = await commerce.getProducts({ query: 'shirt' })
const cart = await commerce.createCart()

// Event-driven side effects
commerce.events.on('order.created', ({ order }) => {
  console.log('New order:', order.id)
})
```

## Multi-Adapter Composition

For advanced setups, compose multiple adapters with orchestrator factories:

```typescript
import { createCompositeOrchestrator, withPlatformFallback } from '@commercejs/core'

// Merge domains from multiple sources
const orchestrator = createCompositeOrchestrator({
  sources: {
    salla: sallaAdapter,
    platform: platformAdapter,
  },
  mapping: {
    catalog: 'salla',
    store: 'salla',
    cart: 'platform',
  },
})

// Or fill gaps in a primary adapter
const full = withPlatformFallback(sallaAdapter, platformAdapter)
```

## Notification & Analytics Providers

Register providers to automatically react to commerce events:

```typescript
import { createResendProvider } from '@commercejs/notification-resend'
import { createGA4Provider } from '@commercejs/analytics-ga'

const commerce = createCommerce({
  adapter,
  notifications: {
    resend: createResendProvider({ apiKey: 're_...', from: 'store@example.com' }),
  },
  notificationRules: [
    {
      event: 'order.created',
      channel: 'email',
      provider: 'resend',
      buildMessage: (payload) => ({
        to: payload.order.customer.email,
        subject: 'Order confirmed',
      }),
    },
  ],
  analytics: [
    createGA4Provider({ measurementId: 'G-XXXXXXXXXX' }),
  ],
})
```

## Configuration

| Option | Type | Required | Description |
|---|---|---|---|
| `adapter` | `CommerceAdapter` | ✅ | Platform adapter to delegate domain calls to |
| `payments` | `Record<string, PaymentProvider>` | — | Payment providers keyed by ID |
| `defaultPayment` | `string` | — | Default payment provider key |
| `webhooks` | `WebhookEndpoint[]` | — | Webhook delivery targets |
| `notifications` | `Record<string, NotificationProvider>` | — | Notification providers keyed by ID |
| `notificationRules` | `NotificationRule[]` | — | Event → notification routing rules |
| `analytics` | `AnalyticsProvider[]` | — | Analytics providers (receive all events) |
| `fetch` | `typeof fetch` | — | Custom fetch for HTTP calls |
| `sign` | `(payload, secret) => string` | — | Custom webhook signing function |

## API

### Catalog

| Method | Description |
|---|---|
| `getProduct(params)` | Get a single product by ID |
| `getProducts(params)` | Search/list products |
| `getCategories(params?)` | List categories |
| `getBrands()` | List brands |

### Cart

| Method | Description |
|---|---|
| `createCart()` | Create a new cart |
| `getCart(cartId)` | Retrieve a cart |
| `addToCart(cartId, item)` | Add item to cart |
| `updateCartItem(cartId, itemId, qty)` | Update item quantity |
| `removeFromCart(cartId, itemId)` | Remove item from cart |

### Checkout

| Method | Description |
|---|---|
| `getShippingMethods(cartId)` | List available shipping methods |
| `setShippingAddress(cartId, address)` | Set shipping address |
| `setBillingAddress(cartId, address)` | Set billing address |
| `setShippingMethod(cartId, methodId)` | Select shipping method |
| `getPaymentMethods(cartId)` | List payment methods |
| `setPaymentMethod(cartId, methodId)` | Select payment method |
| `placeOrder(cartId)` | Complete checkout and place order |

### Customer

| Method | Description |
|---|---|
| `login(email, password)` | Authenticate customer |
| `register(input)` | Create new customer |
| `getCustomer()` | Get current customer |
| `logout()` | End session |
| `getAddresses()` | List saved addresses |
| `addAddress(address)` | Add new address |

### Payments

| Method | Description |
|---|---|
| `createPayment(input, providerId?)` | Create payment session |
| `getPayment(sessionId, providerId)` | Retrieve payment status |
| `refundPayment(input, providerId)` | Process refund |

### Event Bus

```typescript
commerce.events.on('product.viewed', handler)
commerce.events.on('cart.item.added', handler)
commerce.events.on('order.created', handler)
commerce.events.on('*', wildcardHandler) // all events
commerce.events.off('order.created', handler)
```

### Orchestrator Factories

| Export | Description |
|---|---|
| `createOrchestrator(config)` | Wrap a single adapter as an orchestrator |
| `createCompositeOrchestrator(config)` | Merge domains from multiple adapters |
| `withPlatformFallback(primary, fallback)` | Fill adapter gaps with a fallback |

## Exports

| Export | Type | Description |
|---|---|---|
| `createCommerce` | Function | Main factory function |
| `CommerceConfig` | Type | Configuration interface |
| `CommerceInstance` | Type | Return type of `createCommerce()` |
| `createOrchestrator` | Function | Single adapter → orchestrator |
| `createCompositeOrchestrator` | Function | Multi-adapter composition |
| `withPlatformFallback` | Function | Gap-filling fallback |
| `CommerceEventBus` | Class | Typed event emitter |
| `createWebhookDispatcher` | Function | Webhook delivery engine |

## Documentation

Full docs at [commerce.js.org](https://commerce.js.org)

## License

[MIT](../../LICENSE)
