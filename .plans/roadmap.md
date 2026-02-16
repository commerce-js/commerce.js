# CommerceJS — Roadmap & Backlog

> Architecture vision + prioritized feature backlog

---

## 🏗️ Architecture Vision

> CommerceJS is a **composable commerce orchestrator** — not a monolithic adapter.

```
┌──────────────────────────────────────────────────────────────┐
│               CommerceOrchestrator                           │
│                                                              │
│  DOMAINS (Data Adapters)                                     │
│  ├─ Tier 1: catalog, store (universal)                       │
│  ├─ Tier 2: cart, checkout, orders, customers... (common)    │
│  └─ Tier 3: wholesale, auctions, rentals... (specialized)    │
│                                                              │
│  PROVIDERS (Side-Effect Services)                            │
│  ├─ payments: { tap, stripe, ... }                           │
│  ├─ notifications: { email, sms, push, whatsapp, ... }       │
│  ├─ analytics: { ga, segment, ... }                          │
│  ├─ tax: TaxProvider                                         │
│  └─ search: SearchProvider                                   │
│                                                              │
│  INFRASTRUCTURE                                              │
│  ├─ events: CommerceEventBus                                 │
│  └─ webhooks: WebhookDispatcher                              │
└──────────────────────────────────────────────────────────────┘
```

**Core principles:**
- **Composable adapters** — mix data from different sources per domain
- **Domains vs Providers** — data sources (CRUD) vs side-effect services (event-driven)
- **Three-tier domains** — Universal (always), Common (optional), Specialized (niche)
- **Platform fallback** — auto-fill gaps in third-party adapters with native engine
- **Universal Checkout** — channel-agnostic state machine (web, mobile, POS, AI)
- **Pluggable providers** — payments, notifications, analytics as event-driven plugins
- **Event-driven sync** — real-time coordination between adapters

---

## ✅ Phase 1: Prove the Contract *(Complete)*

**Goal:** Make adapters composable, tested, and trustworthy.

- [x] Refactor `CommerceAdapter` into 15 composable sub-interfaces
- [x] Add `PaymentProvider` interface (extracted from checkout)
- [x] Add capabilities system (`adapter.capabilities` array)
- [x] Contract test suite (258-line test in `adapter-salla/__tests__/`)
- [x] Mapper unit tests for `adapter-salla` (592-line test, 10 mappers)
- [x] Implement full Salla adapter: catalog, orders, customers, reviews, promotions, store, brands, countries, locations
- [x] Token refresh (server-only, Option A)
- [x] New composables: `useBrands`, `useCountries`, `useLocations`
- [x] E2E validation: full Nuxt stack works end-to-end

---

## ✅ Phase 1b: Reference Storefront *(Complete)*

**Goal:** Premium Nuxt 3 storefront demonstrating the SDK.

- [x] Scaffold Nuxt app with Nuxt UI v4
- [x] Layout, theme & design system (indigo, dark mode, RTL-ready)
- [x] Homepage, product listing, category pages
- [x] Product detail page
- [x] Cart & checkout flow (country/city selectors, shipping, payments)
- [ ] T07: Build & E2E validation (deferred — functional, needs polish)

---

## ✅ Phase 2: SDK Quality & DX *(Complete)*

**Goal:** Harden the SDK — validation, error handling, DRY, developer experience.

### 2a: Foundations (DRY + Error Handling)
- [x] Extract `parseJsonField` → `@commercejs/platform/src/domains/helpers.ts`
- [x] Create `defineCommerceHandler` wrapper (centralized error boundary + adapter injection)
- [x] Migrate all 44 API handlers to `defineCommerceHandler`

### 2b: Validation + Route Restructure
- [x] Add Zod schemas to `@commercejs/nuxt` (18 schemas for all mutations)
- [x] Add `schema.parse()` validation to all mutation handlers
- [x] Restructure API routes → `runtime/server/api/_commerce/` (nested directory tree)
- [x] Replace 47 manual `addServerHandler` calls with single `addServerScanDir`

### 2c: Composable Improvements
- [x] Fix `useCustomer` → `$fetch` pattern (align with `useCart`/`useCheckout`)
- [x] Create `useOrders` composable (load, cancel, reorder)
- [x] Create `usePrice` composable (`Intl.NumberFormat` formatting)
- [x] Verify `useState` keys use `commerce_` prefix

### 2d: Request-Scoped Context + Order IDs
- [x] Implement `CommerceContext` (requestId, locale, generateId per request)
- [x] ULID-based request IDs and order number generation

---

## ✅ Phase 3: Architecture Evolution *(Complete)*

**Goal:** Multi-adapter composition, platform fallback, notification & analytics providers.

### 3a: Three-Tier Orchestrator
- [x] Design `CommerceOrchestrator` interface (Universal/Common/Specialized tiers)
- [x] `supports<D>(domain)` type guard with TypeScript narrowing
- [x] `createOrchestrator()` factory function
- [x] Preserve `CommerceAdapter` for backward compatibility

### 3b: Multi-Source Composition
- [x] Implement `createCompositeOrchestrator()` (~105 lines)
- [x] Domain-level provider configuration (catalog from Shopify, customers from CRM, etc.)
- [x] Type-safe domain routing

### 3c: Platform Fallback
- [x] Implement `withPlatformFallback()` (~95 lines)
- [x] Auto-fill missing adapter domains with fallback orchestrator
- [x] Test coverage: 5 tests for gap-filling, capability merging, universal domain precedence

### 3d: Notification Providers
- [x] `NotificationProvider` interface (`send()`, channels: email/sms/push/whatsapp/telegram)
- [x] `NotificationRule` config (event → channel → template mapping)
- [x] Event bus wiring in `createCommerce()`
- [x] Reference provider: `@commercejs/notification-resend` — 9 tests, published to npm

### 3e: Analytics & Tax Providers
- [x] `AnalyticsProvider` interface (track, identify, page)
- [x] Auto-track all commerce events via `onAny()` wildcard
- [x] `TaxProvider` interface (calculate, commit, void)
- [x] Reference provider: `@commercejs/analytics-ga` — 12 tests, published to npm

---

## ✅ Phase 4: Universal Checkout + Second Adapter *(In Progress)*

### Universal Checkout (`@commercejs/checkout`)
- [x] Checkout state machine (cart → address → shipping → payment → confirm)
- [x] Payment gateway registry (pluggable providers)
- [ ] Channel-agnostic (web, mobile, POS, AI agent)
- [ ] Embeddable with single line of code

### Second Adapter: Medusa (`@commercejs/adapter-medusa`) ✅
- [x] Full storefront API (7 domains: catalog, cart, checkout, customers, orders, store, countries)
- [x] Proves portability of the type system — 7 mapper modules, 25+ raw Medusa types
- [x] HTTP client with publishable API key + JWT auth
- [x] Contract test suite — 44 tests, all passing
- [x] Build verification — clean TypeScript compilation

---

## 🎯 Phase 5: DX & Developer Tools

- [ ] OpenAPI 3.1 spec auto-generation from routes + types
- [ ] CLI tool for adapter scaffolding + contract testing
- [x] Package READMEs — all 14 packages documented
- [ ] Postman collection

---

## 🎯 Phase 6: Future Vision

### SoftPOS Mobile Payments
- [ ] `@commercejs/payment-softpos` — NFC tap-to-pay provider
- [ ] `@commercejs/payment-cash` — cash handling for POS
- [ ] `@commercejs/pos` — POS mobile app (Capacitor/RN)

### Agentic Commerce
- [ ] `@commercejs/mcp-server` — MCP server wrapping adapter contract
- [ ] `llms.txt` / `agents.json` discovery
- [ ] A2A protocol support

### Additional Domains (Tier 3)
- [ ] Content / CMS adapter (pages, banners)
- [ ] Loyalty / Rewards adapter (points, tiers)
- [ ] Subscriptions / Recurring adapter
- [ ] Search Provider (Algolia, Meilisearch, Typesense)

### Other
- [ ] Multi-market / multi-currency support
- [ ] Drop-in commerce components (`@commercejs/drop-in`)
- [ ] Promotion rules engine (JSON DSL)

---

## 🎯 Phase 7: CommerceJS Cloud

> Hosted commerce platform — get merchants from zero to production in minutes.
> Inspired by Medusa Cloud but built around CommerceJS's composable architecture.

### Pricing Model
- **No GMV fees** — pay only for infrastructure
- Unlimited orders, products, sales channels
- Three tiers: **Starter** / **Pro** / **Enterprise**

### Cloud Dashboard (`commercejs.cloud`)
- [ ] Project management UI (create, configure, monitor)
- [ ] GitHub integration — push-to-deploy from any branch
- [ ] Environment management (production, staging, preview)
- [ ] Preview environments for every PR (sandboxed app + branched DB)
- [ ] Environment variables management
- [ ] Real-time logs and application health monitoring
- [ ] Usage metrics and billing dashboard

### Managed Infrastructure
- [ ] One-click deploy of CommerceJS backend + storefront
- [ ] Auto-provisioned Postgres database per environment
- [ ] Auto-provisioned Redis / key-value cache
- [ ] S3 object storage per environment (media, assets)
- [ ] Automatic database migrations on deploy
- [ ] Auto-scaling based on traffic (dynamic compute)
- [ ] Global CDN / edge network for storefront hosting
- [ ] SSL/TLS certificates (auto-provisioned)
- [ ] Zero-downtime deployments
- [ ] Automatic backups with point-in-time recovery

### Built-in Services
- [ ] **CommerceJS Cache** — integrated caching layer for API responses (cart, catalog)
- [ ] **CommerceJS Emails** — built-in transactional emails (order confirmations, shipping updates, password resets) with custom domain support and delivery tracking
- [ ] **CommerceJS Admin** — hosted admin dashboard (unlimited users, no per-seat fees)
- [ ] Data import/export tooling (DB dumps, seed data for previews)

### Developer Experience
- [ ] `commercejs deploy` CLI command
- [ ] Monorepo support (backend + storefront in one repo)
- [ ] Build logs and deploy history
- [ ] Seamless adapter configuration (connect any adapter via env vars)
- [ ] Pre-configured commerce stack (app, admin, storefront, DB, cache, storage)

---

## ✅ Completed

### Libraries (published to npm)
- [x] `@commercejs/types` — 26+ domain types, 18+ sub-adapter interfaces
- [x] `@commercejs/core` — `createCommerce()`, EventBus, WebhookDispatcher, Orchestrator factories
- [x] `@commercejs/nuxt` — Nuxt module, 16 composables, 46 auto-discovered REST routes, Zod validation, ULID context
- [x] `@commercejs/adapter-salla` — catalog, orders, customers, reviews, promotions, store info, brands, countries, locations
- [x] `@commercejs/adapter-medusa` — Medusa V2 storefront API (catalog, cart, checkout, customers, orders, store, countries) — 44 contract tests
- [x] `@commercejs/checkout` — checkout state machine
- [x] `@commercejs/payment-tap` — Tap Payments provider
- [x] `@commercejs/webhook-verifier` — cryptographic webhook verification
- [x] `@commercejs/platform` — built-in commerce engine (SQLite/Drizzle + Neon Postgres)
- [x] `@commercejs/cloud` — cloud infrastructure orchestration (Cloudflare, Neon, GitHub, Billing providers)
- [x] `@commercejs/cli` — CLI tool (`deploy`, `init`, `env` commands)
- [x] `@commercejs/notification-resend` — Resend email notification provider (9 tests)
- [x] `@commercejs/notification-smtp` — SMTP email notification provider (11 tests)
- [x] `@commercejs/analytics-ga` — Google Analytics 4 provider (12 tests)

### Applications (private)
- [x] `storefront` — reference Nuxt storefront (homepage, products, categories, cart, checkout)
- [x] `hosted-checkout` — deployable checkout app with Tap card elements
- [x] `docs` — documentation site deployed at commerce.js.org
- [x] `dashboard` — cloud dashboard MVP (Nuxt 4, login/projects/billing)
- [x] `@commercejs/ui` — 17 component domains

### Infrastructure
- [x] Token refresh (server-only, Option A)
- [x] CI/CD: release workflow, docs deployment, changeset versioning
- [x] Contract test suite + mapper unit tests
- [x] Monorepo restructure: apps in `apps/`, libraries in `packages/`

---

## Change Log

- **2026-02-08**: Initial roadmap from Commerce Layer analysis
- **2026-02-09**: Architecture vision added (orchestrator, Universal Checkout, SoftPOS)
- **2026-02-09**: Roadmap restructured into phased approach
- **2026-02-15**: Synced roadmap with actual codebase — Phase 1 marked complete
- **2026-02-15**: Major update — added Phase 2 (SDK Quality), Phase 3 (Architecture Evolution). Added Domains vs Providers distinction, notifications, analytics, composition patterns.
- **2026-02-15**: Phase 2 complete — defineCommerceHandler, Zod validation (18 schemas), addServerScanDir, composable improvements, ULID context
- **2026-02-16**: Phase 3 complete (T01-T05) — three-tier orchestrator, composite/fallback factories, notification/analytics/tax providers, event bus wiring.
- **2026-02-16**: Fixed storefront build — removed broken relative imports in 46 _commerce handlers, switched to Nitro auto-imports via addServerScanDir.
- **2026-02-16**: T06 complete — built and published `@commercejs/notification-resend` (Resend email, 9 tests) and `@commercejs/analytics-ga` (GA4 with 11 event mappings, 12 tests). Phase 3 fully complete.
- **2026-02-16**: All 14 package READMEs created/updated — 4 new (`core`, `notification-resend`, `analytics-ga`, `ui`), 3 rewritten from boilerplate (`hosted-checkout`, `storefront`, `docs`), 3 updated (`types`, `nuxt`, root). Root README updated with new packages.
- **2026-02-16**: Added Phase 7 — CommerceJS Cloud (hosted platform). Inspired by Medusa Cloud: GitHub push-to-deploy, preview environments, auto-scaling, built-in cache/email/admin, zero GMV fees.
- **2026-02-16**: Phase 4 Medusa adapter complete — `@commercejs/adapter-medusa` implements 7 domains (catalog, cart, checkout, customers, orders, store, countries) with 7 mapper modules, HTTP client (publishable API key + JWT auth), and 44 passing contract tests. Proves composability of the type system with a second, architecturally distinct backend.
- **2026-02-16**: Phase 7 Cloud scaffold — built `@commercejs/cloud` (types, 4 providers, deploy orchestrator, webhook handler, preview manager), `@commercejs/cli` (3 commands), Neon Postgres driver for `@commercejs/platform` (async auto-detection from DATABASE_URL), dashboard MVP (login, projects, billing). Monorepo restructured: apps moved to `apps/` directory. Published cloud + cli to npm for trusted publisher setup.
- **2026-02-16**: Built and published `@commercejs/notification-smtp` — SMTP email provider using nodemailer (Gmail, SES, Mailgun, Postfix). 11 tests. Docs page added. Trusted publisher configured.
