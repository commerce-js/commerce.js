# Commerce.js

### Write Once. Sell Everywhere.

---

Every eCommerce platform speaks a different language. **Salla.** **Shopify.** **Medusa.** **WooCommerce.** Each one has its own APIs, its own data shapes, its own payment flows. Building on one means locking into one. Switching means starting over.

**What if you didn't have to choose?**

Commerce.js is a **modular, provider-agnostic eCommerce toolkit** for JavaScript and TypeScript. It gives you a single, unified interface for products, carts, orders, and customers — and maps it to any backend you want.

Write your frontend once. Swap the adapter. Keep everything.

---

## How It Works

Commerce.js sits between your application and your commerce backend. You code against **one interface**. The adapter handles the translation.

```
  Your App
     ↓
 Commerce.js  ←→  Salla  |  Medusa  |  Shopify  |  Your Own DB
     ↓
  Payments   ←→  Tap  |  Stripe  |  SoftPOS
  Email      ←→  Resend  |  SendGrid
  Analytics  ←→  Google Analytics  |  Segment
```

**Five lines to get started:**

```typescript
import { createCommerce } from '@commercejs/core'
import { SallaAdapter } from '@commercejs/adapter-salla'

const commerce = createCommerce({
  adapter: new SallaAdapter({ token: process.env.SALLA_TOKEN }),
})

const products = await commerce.getProducts({ query: 'shirt' })
```

Switch to Medusa? Change one line:

```typescript
import { MedusaAdapter } from '@commercejs/adapter-medusa'

const commerce = createCommerce({
  adapter: new MedusaAdapter({ baseUrl: '...', publishableKey: '...' }),
})
// Same code. Different backend. Zero rewrites.
```

---

## The Architecture That Makes It Possible

### 🧩 Composable Adapters

Not a monolith — a **composition engine**. Mix data from different sources per domain. Catalog from Shopify. Cart from your own DB. Payments from Stripe. The orchestrator wires them together.

### 🏗️ Three-Tier Domain Model

Not every platform supports everything, and that's fine.

| Tier | Domains | Rule |
|---|---|---|
| **Universal** | Catalog, Store | Every adapter implements these |
| **Common** | Cart, Checkout, Orders, Customers | Most adapters have these |
| **Specialized** | Wholesale, Auctions, Rentals, Gift Cards | Only when you need them |

Your code checks capabilities at runtime — `if (commerce.supports('wishlist'))` — no crashes, no surprises.

### ⚡ Event-Driven Plugins

Payments, notifications, and analytics aren't adapters — they're **providers** that hook into a typed event bus. When an order is placed, your email provider, analytics tracker, and webhook dispatcher all fire automatically.

```typescript
commerce.events.on('order.created', ({ order }) => {
  // This fires for Salla, Medusa, Shopify — any adapter
})
```

### 🔄 Platform Fallback

Don't have reviews in your Salla adapter? Commerce.js auto-fills the gap with its **built-in SQLite engine** — no external services needed.

```typescript
const commerce = withPlatformFallback(sallaOrchestrator)
// Salla handles catalog + orders
// SQLite handles reviews + wishlists — automatically
```

---

## The Ecosystem

### Libraries

| | |
|---|---|
| **`@commercejs/types`** | 26+ unified types — the shared language of commerce |
| **`@commercejs/core`** | Orchestration engine, event bus, webhook dispatcher |
| **`@commercejs/checkout`** | Checkout state machine — cart → address → shipping → payment → done |
| **`@commercejs/nuxt`** | Drop-in Nuxt module — 17 composables, 46 auto-generated API routes |
| **`@commercejs/ui`** | 30+ production-ready eCommerce components |
| **`@commercejs/platform`** | Zero-config commerce engine (SQLite) — own your data |

### Adapters

| | |
|---|---|
| **`@commercejs/adapter-salla`** | 9 domains — OAuth, full catalog + orders |
| **`@commercejs/adapter-medusa`** | 7 domains — JWT auth, 44 contract tests |
| *Your adapter here* | Implement the interface. Pass the tests. Ship. |

### Providers

| | |
|---|---|
| **`@commercejs/payment-tap`** | Tap Payments — redirect-based, PCI-free |
| **`@commercejs/webhook-verifier`** | Cryptographic signature verification |
| **`@commercejs/notification-resend`** | Transactional email via Resend |
| **`@commercejs/analytics-ga`** | Google Analytics 4 — auto-tracks all commerce events |

---

## Proven, Not Theoretical

The Medusa adapter is the proof. Two backends that couldn't be more different:

| | Salla | Medusa |
|---|---|---|
| **Auth** | OAuth tokens | JWT + API key |
| **Prices** | Major units (`10.00`) | Minor units (`1000`) |
| **Cart** | No API | Full CRUD + checkout |
| **Pagination** | `page` / `per_page` | `offset` / `limit` |

Both map cleanly to the **same 26 types**. Same frontend. Same composables. Different backend entirely.

**44 contract tests. All green. ✅**

---

## What We've Built So Far

Four complete phases. 11 published packages. 3 live applications.

| Milestone | What Shipped |
|---|---|
| **Contract & First Adapter** | 18 composable sub-interfaces, Salla adapter (9 domains), contract tests |
| **Reference Storefront** | Premium Nuxt 3 storefront — homepage, products, categories, cart, checkout |
| **SDK Quality** | `defineCommerceHandler` error boundary, Zod validation (18 schemas), ULID-based request IDs |
| **Architecture Evolution** | Three-tier orchestrator, multi-source composition, platform fallback, notification + analytics + tax providers |
| **Universal Checkout** | State machine (cart → address → shipping → payment → confirm), pluggable payment gateways |
| **Second Adapter** | Medusa V2 — 7 domains, 7 mappers, 44 contract tests. Proves the type system is truly portable. |
| **Documentation** | Full docs site at [commerce.js.org](https://commerce.js.org), all 14 package READMEs |

---

## Where We're Going

### Phase 5: Developer Experience

Make it effortless to build on Commerce.js.

- **OpenAPI 3.1 spec** — Auto-generated from routes + types. Import into Postman, generate clients in any language.
- **CLI scaffolding** — `npx @commercejs/cli create-adapter` generates a new adapter package with types, tests, and build config pre-wired.
- **Contract test runner** — `npx @commercejs/cli test` validates your adapter against the full contract suite.
- **Postman collection** — Ready-to-use API explorer for every commerce endpoint.

---

### Phase 6: The Big Bets

#### 🤖 Agentic Commerce

The adapter contract isn't just for frontends — it's for **AI agents**.

- **`@commercejs/mcp-server`** — An MCP server wrapping the full adapter contract. AI agents browse catalogs, manage carts, and place orders through natural language.
- **`llms.txt` & `agents.json`** — Standard discovery files so AI agents can find and understand your store's capabilities.
- **A2A protocol** — Agent-to-agent commerce. Your purchasing agent talks directly to a supplier's sales agent.

> *Imagine:* "Order 50 units of SKU-1234 from our preferred supplier, negotiate for bulk pricing, and schedule delivery for next Tuesday." — handled entirely by agents.

#### 📱 SoftPOS Mobile Payments

Turn any phone into a point-of-sale terminal.

- **`@commercejs/payment-softpos`** — NFC tap-to-pay provider. Accept contactless payments with zero hardware.
- **`@commercejs/payment-cash`** — Cash handling for POS scenarios (drawer management, change calculation).
- **`@commercejs/pos`** — Full POS mobile app built with Capacitor or React Native.

> The same `PaymentProvider` interface that powers online checkout now works at the counter.

#### 🧩 Additional Domains

Expand what adapters can do:

| Domain | Use Case |
|---|---|
| **Content / CMS** | Pages, banners, blog posts — managed from your commerce backend |
| **Loyalty & Rewards** | Points, tiers, redemptions — works with any adapter |
| **Subscriptions** | Recurring orders, subscription boxes, metered billing |
| **Search** | Algolia, Meilisearch, Typesense — pluggable search providers |
| **Multi-market** | Multi-currency, regional pricing, market-specific catalogs |
| **Drop-in Components** | Pre-built UI widgets: add-to-cart button, product card, checkout form |

---

### Phase 7: Commerce.js Cloud

> **Get merchants from zero to production in minutes.**

A hosted commerce platform built around composable architecture — inspired by Vercel's developer experience, Medusa Cloud's commerce focus, and a pricing model that doesn't punish growth.

#### The Dashboard (`cloud.commercejs.org`)

- **Project management** — Create, configure, and monitor your commerce projects
- **GitHub integration** — Push to any branch and auto-deploy
- **Preview environments** — Every PR gets a sandboxed app + branched database
- **Real-time logs** — Application health, request tracing, error monitoring
- **Usage & billing** — Clear visibility into what you're using and what it costs

#### Managed Infrastructure

Everything auto-provisioned. Nothing to configure.

- **One-click deploy** — Commerce backend + storefront, ready in minutes
- **Postgres per environment** — Production, staging, preview — each isolated
- **Redis cache layer** — API response caching out of the box
- **S3 object storage** — Media and assets, per environment
- **Global CDN** — Edge network for storefront hosting worldwide
- **Auto-scaling** — Dynamic compute that grows with your traffic
- **Zero-downtime deploys** — Blue-green deployments, automatic rollback
- **Automatic backups** — Point-in-time recovery for every database

#### Built-in Services

| Service | What It Does |
|---|---|
| **CommerceJS Cache** | Integrated caching for catalog, cart, and API responses |
| **CommerceJS Emails** | Transactional emails — order confirmations, shipping updates, password resets. Custom domain support. |
| **CommerceJS Admin** | Hosted admin dashboard — unlimited users, no per-seat fees |

#### Pricing: No GMV Fees. Ever.

Most commerce platforms take a cut of every sale. We don't.

- **Pay only for infrastructure** — compute, storage, bandwidth
- **Unlimited** orders, products, and sales channels
- **Three tiers:** Starter → Pro → Enterprise
- **No surprises** — your success doesn't become our fee

---

## Built With

[TypeScript](https://www.typescriptlang.org/) · [Nuxt](https://nuxt.com/) · [Turborepo](https://turbo.build/) · [Vitest](https://vitest.dev/) · [pnpm](https://pnpm.io/) · [Changesets](https://github.com/changesets/changesets)

MIT Licensed · [commerce.js.org](https://commerce.js.org) · [GitHub](https://github.com/commerce-js/commerce.js)

---

<p align="center">
  <strong>Stop rewriting. Start composing.</strong><br/>
  <em>Commerce.js — the composable commerce layer for JavaScript.</em>
</p>
