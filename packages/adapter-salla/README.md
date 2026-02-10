# @commercejs/adapter-salla

Salla platform adapter for CommerceJS — maps the Salla REST API to the unified data model.

[![npm](https://img.shields.io/npm/v/@commercejs/adapter-salla?color=CB3837)](https://www.npmjs.com/package/@commercejs/adapter-salla)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@commercejs/adapter-salla` implements the `CommerceAdapter` interface for [Salla](https://salla.com/), the leading Arabic eCommerce platform. It translates Salla's REST API responses into CommerceJS unified types, so your storefront code is platform-independent.

## Install

```bash
npm install @commercejs/adapter-salla @commercejs/types
```

## Quick Start

```typescript
import { SallaAdapter } from '@commercejs/adapter-salla'

const adapter = new SallaAdapter({
  accessToken: process.env.SALLA_ACCESS_TOKEN!,
  baseUrl: 'https://api.salla.dev/admin/v2', // optional
})

// Catalog
const products = await adapter.getProducts({ limit: 10, page: 1 })
const product = await adapter.getProduct('product-id')
const categories = await adapter.getCategories()
const brands = await adapter.getBrands()

// Cart
const cart = await adapter.getCart('cart-id')
const updated = await adapter.addToCart({ productId: '123', quantity: 2 })

// Customer
const customer = await adapter.getCustomer()
const orders = await adapter.getOrders()

// Store info
const store = await adapter.getStore()
```

## Exports

### Main

| Export | Description |
|--------|-------------|
| `SallaAdapter` | Full adapter implementing `CommerceAdapter` |
| `SallaClient` | Low-level HTTP client for custom Salla API calls |
| `SallaConfig` | Configuration type |

### Mappers

Individual mapper functions for custom transformations:

```typescript
import { mapSallaProduct, mapSallaCategory } from '@commercejs/adapter-salla'

// Transform raw Salla API data to CommerceJS types
const product = mapSallaProduct(sallaRawProduct)
```

Available mappers: `mapSallaProduct`, `mapSallaCategory`, `mapSallaCustomer`, `mapSallaAddress`, `mapSallaOrder`, `mapSallaOrderStatus`, `mapSallaOrderHistory`, `mapSallaReview`, `mapSallaShipping`, `mapSallaPayment`, `mapSallaBrand`, `mapSallaCountry`, `mapSallaBranch`

### Raw Types

All Salla API response types are exported for advanced usage:

```typescript
import type { SallaRawProduct, SallaRawOrder } from '@commercejs/adapter-salla'
```

## Configuration

```typescript
interface SallaConfig {
  /** Salla API access token */
  accessToken: string
  /** Base URL for the Salla API (default: https://api.salla.dev/admin/v2) */
  baseUrl?: string
}
```

## Documentation

Full docs at [commerce.js.org](https://commerce.js.org)

## License

[MIT](../../LICENSE)
