# @commercejs/nuxt

CommerceJS Nuxt module — composables, plugin, and auto-generated REST API.

[![npm](https://img.shields.io/npm/v/@commercejs/nuxt?color=CB3837)](https://www.npmjs.com/package/@commercejs/nuxt)
[![Nuxt](https://img.shields.io/badge/Nuxt-18181B?logo=nuxt)](https://nuxt.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@commercejs/nuxt` is a Nuxt module that integrates CommerceJS into your Nuxt application. It provides auto-imported composables, injects the adapter into your app context, and optionally generates a full REST API from your adapter — zero boilerplate.

## Install

```bash
npm install @commercejs/nuxt @commercejs/types @commercejs/adapter-salla
```

## Setup

Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@commercejs/nuxt'],

  commerce: {
    adapter: 'salla',       // adapter package to use
    apiBase: '/api/_commerce', // REST API base path (default)
    apiRoutes: true,         // auto-generate REST routes (default)
  },
})
```

## Usage

### Composables

The module auto-imports composables for your Vue components:

```vue
<script setup>
const { data: products } = await useCommerce().getProducts({ limit: 12 })
const { data: cart } = await useCommerce().getCart(cartId)
</script>
```

### Plugin

The adapter is available on `$commerce` in your Nuxt app:

```typescript
const { $commerce } = useNuxtApp()
const store = await $commerce.getStore()
```

### Auto-Generated REST API

When `apiRoutes` is enabled, the module registers 40+ REST endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/_commerce/products` | GET | List products |
| `/api/_commerce/products/:id` | GET | Get product by ID |
| `/api/_commerce/categories` | GET | List categories |
| `/api/_commerce/cart` | POST | Create cart |
| `/api/_commerce/cart/:id` | GET | Get cart |
| `/api/_commerce/cart/:id/items` | POST | Add to cart |
| `/api/_commerce/checkout/place-order` | POST | Place order |
| `/api/_commerce/auth/login` | POST | Login |
| `/api/_commerce/customer` | GET | Get customer profile |
| `/api/_commerce/customer/orders` | GET | List orders |
| `/api/_commerce/wishlist` | GET | Get wishlist |
| `/api/_commerce/reviews/:productId` | GET | Get product reviews |
| ... | ... | 30+ more routes |

## Configuration

```typescript
interface CommerceModuleOptions {
  /** Adapter name: 'salla', 'shopify', 'medusa', etc. */
  adapter?: string

  /** REST API base path (default: '/api/_commerce') */
  apiBase?: string

  /** Auto-generate REST API routes (default: true) */
  apiRoutes?: boolean
}
```

## Documentation

Full docs at [commerce.js.org](https://commerce.js.org)

## License

[MIT](../../LICENSE)
