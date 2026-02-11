<p align="center">
  <h1 align="center">CommerceJS</h1>
  <p align="center">
    A modular, provider-agnostic eCommerce toolkit for JavaScript and TypeScript.
  </p>
</p>

<p align="center">
  <a href="https://github.com/commerce-js/commerce.js/actions/workflows/release.yml"><img src="https://github.com/commerce-js/commerce.js/actions/workflows/release.yml/badge.svg" alt="Release"></a>
  <a href="https://www.npmjs.com/org/commercejs"><img src="https://img.shields.io/badge/npm-%40commercejs-CB3837?logo=npm&logoColor=white" alt="npm"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://nuxt.com/"><img src="https://img.shields.io/badge/Nuxt-00DC82?logo=nuxt.js&logoColor=white" alt="Nuxt"></a>
  <a href="https://turbo.build/"><img src="https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white" alt="Turborepo"></a>
  <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white" alt="pnpm"></a>
  <a href="https://commerce.js.org"><img src="https://img.shields.io/badge/Docs-commerce.js.org-blue?logo=readthedocs&logoColor=white" alt="Docs"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

---

## Overview

Every eCommerce platform speaks a different language — Salla, Shopify, WooCommerce each have their own APIs, data shapes, and payment flows. Switching platforms means rewriting everything.

**CommerceJS** solves this with three core ideas:

- **Unified types** — A single data model for products, carts, orders, and customers that works across every platform
- **Adapter pattern** — Each platform implements the `CommerceAdapter` interface, mapping its API to the unified types
- **Pluggable providers** — Payment providers implement the `PaymentProvider` interface, making them hot-swappable

It works across any JavaScript runtime — Node.js, Edge, Deno, or the browser.

## Documentation

Visit the full documentation at **[commerce.js.org](https://commerce.js.org)**

## Packages

### Libraries (published to npm)

| Package | Version | Description |
|---------|---------|-------------|
| [`@commercejs/types`](packages/types) | [![npm](https://img.shields.io/npm/v/@commercejs/types?color=CB3837&label=)](https://www.npmjs.com/package/@commercejs/types) | Unified Data Model — 20+ domain types |
| [`@commercejs/checkout`](packages/checkout) | [![npm](https://img.shields.io/npm/v/@commercejs/checkout?color=CB3837&label=)](https://www.npmjs.com/package/@commercejs/checkout) | Checkout state machine for payment flows |
| [`@commercejs/payment-tap`](packages/payment-tap) | [![npm](https://img.shields.io/npm/v/@commercejs/payment-tap?color=CB3837&label=)](https://www.npmjs.com/package/@commercejs/payment-tap) | Tap Payments provider — redirect-based, PCI-free |
| [`@commercejs/webhook-verifier`](packages/webhook-verifier) | [![npm](https://img.shields.io/npm/v/@commercejs/webhook-verifier?color=CB3837&label=)](https://www.npmjs.com/package/@commercejs/webhook-verifier) | Cryptographic webhook signature verification |
| [`@commercejs/adapter-salla`](packages/adapter-salla) | [![npm](https://img.shields.io/npm/v/@commercejs/adapter-salla?color=CB3837&label=)](https://www.npmjs.com/package/@commercejs/adapter-salla) | Salla platform adapter |
| [`@commercejs/nuxt`](packages/nuxt) | [![npm](https://img.shields.io/npm/v/@commercejs/nuxt?color=CB3837&label=)](https://www.npmjs.com/package/@commercejs/nuxt) | Nuxt module — composables, plugin, and auto-generated REST API |

### Applications (private)

| App | Description |
|-----|-------------|
| [`hosted-checkout`](packages/hosted-checkout) | Deployable checkout app with embedded Tap card elements |
| [`storefront`](packages/storefront) | Reference storefront built with Nuxt |
| [`docs`](packages/docs) | Documentation site — [commerce.js.org](https://commerce.js.org) |

## Architecture

```mermaid
graph TD
    A["@commercejs/types"] --> B["@commercejs/checkout"]
    A --> C["@commercejs/payment-tap"]
    A --> D["@commercejs/adapter-salla"]
    A --> E["@commercejs/webhook-verifier"]
    B --> F["hosted-checkout"]
    C --> F
    E --> F
    D --> G["storefront"]

    style A fill:#3178C6,color:#fff
    style B fill:#10B981,color:#fff
    style C fill:#8B5CF6,color:#fff
    style D fill:#F59E0B,color:#000
    style E fill:#EF4444,color:#fff
    style F fill:#6366F1,color:#fff
    style G fill:#EC4899,color:#fff
```

All packages depend on `@commercejs/types` as the shared language. The checkout engine accepts any `PaymentProvider` implementation. The hosted checkout ties everything together into a deployable app.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [pnpm](https://pnpm.io/) v9+

### Setup

```bash
# Clone the repository
git clone https://github.com/commerce-js/commerce.js.git
cd commerce.js

# Install dependencies
pnpm install

# Build all packages
pnpm turbo run build
```

### Development

```bash
# Run the docs site locally
cd packages/docs && pnpm dev

# Run the storefront locally
cd packages/storefront && pnpm dev

# Run tests
pnpm turbo run test

# Type check
pnpm turbo run typecheck
```

## Quick Start

### Using the checkout engine

```typescript
import { CheckoutSession } from '@commercejs/checkout'
import { TapPaymentProvider } from '@commercejs/payment-tap'

const provider = new TapPaymentProvider({
  secretKey: process.env.TAP_SECRET_KEY!,
  publishableKey: process.env.TAP_PUBLISHABLE_KEY!,
})

const session = new CheckoutSession({ provider })

session.on('complete', ({ session }) => {
  console.log('Payment complete:', session.id)
})

await session.initialize({
  amount: 100,
  currency: 'SAR',
  customer: { email: 'customer@example.com' },
})
```

### Using the Salla adapter

```typescript
import { createSallaAdapter } from '@commercejs/adapter-salla'

const adapter = createSallaAdapter({
  accessToken: process.env.SALLA_TOKEN!,
})

const products = await adapter.getProducts({ limit: 10 })
const cart = await adapter.getCart(cartId)
```

### Verifying webhooks

```typescript
import { verifyWebhook } from '@commercejs/webhook-verifier'

const isValid = verifyWebhook({
  provider: 'tap',
  payload: request.body,
  secret: process.env.WEBHOOK_SECRET!,
  signature: request.headers['x-tap-signature'],
})
```

## Repository Structure

```
commerce.js/
├── packages/
│   ├── types/               # Unified data model types
│   ├── checkout/            # Checkout state machine
│   ├── payment-tap/         # Tap Payments provider
│   ├── webhook-verifier/    # Webhook signature verification
│   ├── adapter-salla/       # Salla platform adapter
│   ├── core/                # Nuxt module
│   ├── hosted-checkout/     # Deployable checkout app
│   ├── storefront/          # Reference storefront
│   └── docs/                # Documentation site
├── .github/workflows/       # CI/CD pipelines
├── .changeset/              # Version management
├── turbo.json               # Turborepo task config
└── pnpm-workspace.yaml      # Workspace definition
```

## Contributing

Contributions are welcome! This project uses [Changesets](https://github.com/changesets/changesets) for versioning.

```bash
# Create a changeset after making changes
pnpm release

# Follow the prompts to select packages and describe your change
# Commit the generated changeset file with your PR
```

When your PR is merged to `main`, the release workflow automatically creates a version PR. Merging that PR publishes updated packages to npm.

## Reporting Issues

Found a bug or have a suggestion? [Open an issue](https://github.com/commerce-js/commerce.js/issues).

Please include:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Package name and version

## Acknowledgements

Built with these excellent open source projects:

- **[Nuxt](https://nuxt.com/)** — Full-stack Vue framework
- **[Turborepo](https://turbo.build/)** — High-performance monorepo build system
- **[Changesets](https://github.com/changesets/changesets)** — Version management for monorepos
- **[Vitest](https://vitest.dev/)** — Blazing fast unit testing
- **[TypeScript](https://www.typescriptlang.org/)** — Type-safe JavaScript
- **[pnpm](https://pnpm.io/)** — Fast, disk-efficient package manager

## License

This project is licensed under the [MIT License](LICENSE).

Core packages (`@commercejs/types`, `@commercejs/checkout`, `@commercejs/nuxt`, etc.) are MIT-licensed and free to use in any project. Premium adapters may use a separate commercial license — check individual package `LICENSE` files for details.
