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

## Remote mode (CommerceJS Cloud)

Self-hosted storefronts can point `@commercejs/nuxt` at a hosted CommerceJS API instead of
running their own adapter locally. In **remote mode** the module skips all local route handlers,
skips adapter initialisation, and installs a single catch-all proxy at your `apiBase` that
forwards every request to the remote host with your API key attached.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@commercejs/nuxt'],
  commerce: {
    // Local proxy path — composables call this (same-origin, no CORS)
    apiBase: '/api/storefront',
    // remoteApiBase and apiKey are typically set via env vars — see below
  },
})
```

```bash
# .env
NUXT_COMMERCE_REMOTE_API_BASE=https://acme.commercejs.cloud/api/storefront
NUXT_COMMERCE_API_KEY=cjs_live_xxxxxxxxxxxx
```

That's the whole config. When `NUXT_COMMERCE_REMOTE_API_BASE` (or `commerce.remoteApiBase`)
is set, the module automatically:

- forces `apiRoutes: false` (no local route handlers registered)
- defaults `apiBase` to `/api/storefront` if you haven't set one
- skips the adapter Nitro plugin (no DB / platform credentials needed)
- mounts a catch-all proxy at `${apiBase}/**` that:
  - forwards method, body, query, and cookies to the remote URL
  - injects `X-Commerce-Key` from `NUXT_COMMERCE_API_KEY` (server-side only)
  - rewrites upstream `Set-Cookie` `Domain=…` to empty so the buyer session
    cookie lands on the self-hosted origin

Browser traffic always goes to the self-hosted origin → no CORS preflight, no cookie-domain
friction. Only the server↔server hop pays the network cost.

## Configuration

```typescript
interface CommerceModuleOptions {
  /** Adapter name: 'salla', 'shopify', 'medusa', etc. (ignored in remote mode) */
  adapter?: string

  /** Local API path. Default: '/api/_commerce' (local mode) or '/api/storefront' (remote mode) */
  apiBase?: string

  /** Auto-generate REST API routes (default: true; forced false in remote mode) */
  apiRoutes?: boolean

  /** Remote API URL. Setting this switches the module into remote mode. */
  remoteApiBase?: string

  /** API key sent as X-Commerce-Key on proxied requests (remote mode only). */
  apiKey?: string

  /** OpenAPI spec generation (default: true; skipped in remote mode). */
  openAPI?: boolean
}
```

## Documentation

Full docs at [commerce.js.org](https://commerce.js.org)

## License

[MIT](../../LICENSE)
