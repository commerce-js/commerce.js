# @commercejs/delivery-parcel

Parcel last-mile delivery provider for [Commerce.js](https://github.com/commerce-js/commerce.js).

Wraps the [Parcel Delivery API v4](https://api-docs.tryparcel.com) and normalizes responses into Commerce.js's unified `DeliveryProvider` interface.

## Installation

```bash
npm install @commercejs/delivery-parcel
```

## Quick Start

```ts
import { ParcelDeliveryProvider } from '@commercejs/delivery-parcel'

const parcel = new ParcelDeliveryProvider({
  clientId: process.env.PARCEL_CLIENT_ID!,
  clientSecret: process.env.PARCEL_CLIENT_SECRET!,
  region: 'SA-riyadh',
})

// Estimate delivery fee
const estimate = await parcel.estimate({
  origin: {
    contactName: 'Store',
    contactPhone: '+966500000000',
    firstLine: 'Olaya St, Riyadh',
    latitude: 24.7136,
    longitude: 46.6753,
  },
  destination: {
    contactName: 'Customer',
    contactPhone: '+966512345678',
    firstLine: 'King Fahd Rd, Riyadh',
    latitude: 24.7743,
    longitude: 46.7386,
  },
})
console.log(estimate.fee, estimate.currency) // 12.5 SAR

// Create a delivery
const delivery = await parcel.createDelivery({
  origin: {
    contactName: 'Store',
    contactPhone: '+966500000000',
    firstLine: 'Olaya St, Riyadh',
    latitude: 24.7136,
    longitude: 46.6753,
  },
  destination: {
    contactName: 'Customer',
    contactPhone: '+966512345678',
    firstLine: 'King Fahd Rd, Riyadh',
    latitude: 24.7743,
    longitude: 46.7386,
  },
  orderId: 'order_abc123',
  payment: { amount: 50, type: 'cash' },
})

// Track delivery
const status = await parcel.getDelivery(delivery.id)

// Cancel if needed
const cancelled = await parcel.cancelDelivery(delivery.id)
```

## Configuration

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `clientId` | `string` | ✅ | — | OAuth2 client ID |
| `clientSecret` | `string` | ✅ | — | OAuth2 client secret |
| `webhookSecret` | `string` | — | — | For webhook payload verification |
| `region` | `string` | — | — | Region header (e.g., `SA-riyadh`) |
| `baseUrl` | `string` | — | `https://api.tryparcel.com/api` | API base URL override |
| `fetchFn` | `typeof fetch` | — | `globalThis.fetch` | Custom fetch for testing |

## Authentication

Parcel uses OAuth2 `client_credentials` flow. The provider handles token acquisition and caching automatically. Tokens are refreshed 60s before expiry and on 401 responses.

## Webhook Verification

Parcel embeds a `WebhookSecret` in the webhook payload body:

```ts
const event = await parcel.verifyWebhook(request.body, '')
// event.type: 'delivery.updated' | 'delivery.location'
// event.deliveryId: 'TR-001'
// event.status: 'delivered'
```

## License

MIT
