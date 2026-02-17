# @commercejs/delivery-armada

Armada last-mile delivery provider for [Commerce.js](https://github.com/commerce-js/commerce.js).

Wraps the [Armada Delivery API](https://docs.armadadelivery.com) and normalizes responses into Commerce.js's unified `DeliveryProvider` interface.

## Installation

```bash
npm install @commercejs/delivery-armada
```

## Quick Start

```ts
import { ArmadaDeliveryProvider } from '@commercejs/delivery-armada'

const armada = new ArmadaDeliveryProvider({
  accessToken: process.env.ARMADA_ACCESS_TOKEN!,
})

// Estimate delivery fee
const estimate = await armada.estimate({
  origin: { branchId: '682473e10313f6003826e5d7' },
  destination: {
    contactName: 'Ahmed',
    contactPhone: '+96512345678',
    firstLine: 'Salmiya, Block 7',
    latitude: 29.3375,
    longitude: 48.0657,
  },
})
console.log(estimate.fee, estimate.currency) // 2.0 KWD

// Create a delivery
const delivery = await armada.createDelivery({
  origin: { branchId: '682473e10313f6003826e5d7' },
  destination: {
    contactName: 'Ahmed',
    contactPhone: '+96512345678',
    firstLine: 'Salmiya, Block 7',
    latitude: 29.3375,
    longitude: 48.0657,
  },
  orderId: 'order_abc123',
  payment: { amount: 15, type: 'cash' },
})

// Track delivery
const status = await armada.getDelivery(delivery.id)

// Cancel if needed
const cancelled = await armada.cancelDelivery(delivery.id)
```

## Configuration

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `accessToken` | `string` | ✅ | — | Armada API access token |
| `baseUrl` | `string` | — | `https://api.armadadelivery.com/v1` | API base URL override |
| `fetchFn` | `typeof fetch` | — | `globalThis.fetch` | Custom fetch for testing |

## Webhook Verification

Armada uses header-based webhook identification (no HMAC signature). Pass the `x-armada-webhook-topic` header as the `signature` argument:

```ts
const event = await armada.verifyWebhook(
  request.body,
  request.headers['x-armada-webhook-topic'],
)
// event.type: 'delivery.updated' | 'delivery.location'
// event.deliveryId: 'DEL-001'
// event.status: 'delivered'
```

## License

MIT
