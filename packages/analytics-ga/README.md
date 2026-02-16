# @commercejs/analytics-ga

Google Analytics 4 provider for CommerceJS — automatically maps commerce events to GA4 recommended events.

[![npm](https://img.shields.io/npm/v/@commercejs/analytics-ga?color=CB3837)](https://www.npmjs.com/package/@commercejs/analytics-ga)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@commercejs/analytics-ga` implements the `AnalyticsProvider` interface for Google Analytics 4. When registered in `createCommerce()`, all commerce events are automatically tracked in GA4 using the correct [recommended event names](https://developers.google.com/analytics/devguides/collection/ga4/reference/events). SSR-safe — no-ops silently when `gtag` is unavailable.

## Install

```bash
npm install @commercejs/analytics-ga
```

No Google Analytics SDK dependency — uses the browser's `gtag()` global loaded by the GA4 snippet.

## Quick Start

```typescript
import { createCommerce } from '@commercejs/core'
import { createGA4Provider } from '@commercejs/analytics-ga'

const commerce = createCommerce({
  adapter,
  analytics: [
    createGA4Provider({ measurementId: 'G-XXXXXXXXXX' }),
  ],
})

// All commerce events are now tracked in GA4 automatically
```

## Event Mapping

| CommerceJS Event | GA4 Event |
|---|---|
| `product.viewed` | `view_item` |
| `cart.item.added` | `add_to_cart` |
| `cart.item.removed` | `remove_from_cart` |
| `checkout.started` | `begin_checkout` |
| `checkout.completed` | `purchase` |
| `order.created` | `purchase` |
| `payment.created` | `add_payment_info` |
| `customer.registered` | `sign_up` |
| `customer.logged_in` | `login` |

Unmapped events are sent as custom events with dots replaced by underscores (e.g. `wishlist.item.added` → `wishlist_item_added`).

## Configuration

| Option | Type | Required | Description |
|---|---|---|---|
| `measurementId` | `string` | ✅ | GA4 Measurement ID (e.g. `G-XXXXXXXXXX`) |
| `gtag` | `GtagFunction` | — | Custom gtag function (defaults to `window.gtag`) |
| `debug` | `boolean` | — | Enable GA4 debug mode on all events |

## API

| Method | Description |
|---|---|
| `track(event, properties?)` | Send a commerce or custom event |
| `identify(userId, traits?)` | Set GA4 user properties |
| `page(name, properties?)` | Send a `page_view` event |

## Exports

| Export | Type | Description |
|---|---|---|
| `createGA4Provider` | Function | Create a GA4 analytics provider |
| `GA4ProviderConfig` | Type | Configuration interface |
| `GtagFunction` | Type | gtag function signature |

## Documentation

Full docs at [commerce.js.org](https://commerce.js.org)

## License

[MIT](../../LICENSE)
