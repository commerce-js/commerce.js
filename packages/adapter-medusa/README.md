# @commercejs/adapter-medusa

Medusa V2 platform adapter for CommerceJS — maps the Medusa Store API to the unified data model.

[![npm](https://img.shields.io/npm/v/@commercejs/adapter-medusa?color=CB3837)](https://www.npmjs.com/package/@commercejs/adapter-medusa)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@commercejs/adapter-medusa` implements the `CommerceAdapter` interface for [Medusa](https://medusajs.com/), the open-source headless commerce platform. It translates Medusa V2's Store API responses into CommerceJS unified types, making your storefront code platform-independent.

**Supported domains:** catalog, cart, checkout, customers, orders, store, countries

## Install

```bash
npm install @commercejs/adapter-medusa @commercejs/types
```

## Quick Start

```typescript
import { MedusaAdapter } from '@commercejs/adapter-medusa'

const adapter = new MedusaAdapter({
  baseUrl: 'http://localhost:9000',
  publishableApiKey: process.env.MEDUSA_PUBLISHABLE_KEY!,
  defaultRegionId: 'reg_01J...', // optional, used for cart creation
})

// Catalog
const products = await adapter.getProducts({ query: 'shirt' })
const product = await adapter.getProduct({ slug: 'cotton-tee' })
const categories = await adapter.getCategories()

// Cart & Checkout
const cart = await adapter.createCart()
const updated = await adapter.addToCart(cart.id, {
  productId: 'prod_01',
  variantId: 'var_01', // required — Medusa products always have variants
  quantity: 2,
})
const methods = await adapter.getShippingMethods(cart.id)
const order = await adapter.placeOrder(cart.id)

// Customer
const customer = await adapter.login('user@example.com', 'password')
const profile = await adapter.getCustomer()
const orders = await adapter.getCustomerOrders()

// Store info (derived from regions)
const store = await adapter.getStoreInfo()
const countries = await adapter.getCountries()
```

## Exports

### Main

| Export | Description |
|--------|-------------|
| `MedusaAdapter` | Full adapter implementing `CommerceAdapter` |
| `MedusaClient` | Low-level HTTP client for custom Medusa API calls |
| `MedusaConfig` | Configuration type |

### Mappers

Individual mapper functions for custom transformations:

```typescript
import { mapMedusaProduct, mapMedusaCart } from '@commercejs/adapter-medusa'

// Transform raw Medusa API data to CommerceJS types
const product = mapMedusaProduct(medusaRawProduct)
const cart = mapMedusaCart(medusaRawCart)
```

Available mappers: `mapMedusaProduct`, `mapMedusaCategory`, `mapMedusaCart`, `mapMedusaCustomer`, `mapMedusaAddress`, `mapMedusaOrder`, `mapMedusaRegionsToStoreInfo`, `mapMedusaRegionsToCountries`, `mapMedusaShippingOption`

### Raw Types

All Medusa API response types are exported for advanced usage:

```typescript
import type { MedusaProduct, MedusaCart, MedusaOrder } from '@commercejs/adapter-medusa'
```

## Configuration

```typescript
interface MedusaConfig {
  /** Base URL of your Medusa server (e.g. http://localhost:9000) */
  baseUrl: string
  /** Publishable API key from Medusa admin */
  publishableApiKey: string
  /** Default region ID for cart creation (optional) */
  defaultRegionId?: string
  /** JWT token for authenticated customer endpoints (optional) */
  apiToken?: string
  /** Request timeout in ms (default: 30000) */
  timeout?: number
}
```

## Medusa vs Salla — Key Differences

| Aspect | Medusa | Salla |
|--------|--------|-------|
| **Cart** | ✅ Full CRUD + API checkout | ❌ Hosted checkout only |
| **Auth** | JWT via `/auth/customer/emailpass` | OAuth access tokens |
| **Variants** | Always required | Optional |
| **Prices** | Minor units (cents) | Major units (10.00) |
| **Store Info** | Derived from `/regions` | Direct `/store/info` endpoint |

## Documentation

Full docs at [commerce.js.org](https://commerce.js.org)

## License

[MIT](../../LICENSE)
