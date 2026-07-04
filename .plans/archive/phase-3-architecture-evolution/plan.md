# Phase 3: Architecture Evolution — Plan

> Multi-adapter composition, platform fallback, notification & analytics providers.

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [x] **Architecture Design** ✅ Complete
  - Three-tier domain model (Universal/Common/Specialized) — implemented
  - NotificationProvider and AnalyticsProvider interfaces — implemented
  - CompositeOrchestrator and PlatformFallback patterns — implemented

* [x] **T01**: Three-Tier CommerceOrchestrator - Status: ✅ Complete
* [x] **T02**: `createCompositeOrchestrator()` - Status: ✅ Complete
* [x] **T03**: `withPlatformFallback()` - Status: ✅ Complete
* [x] **T04**: NotificationProvider + Event Wiring - Status: ✅ Complete
* [x] **T05**: AnalyticsProvider + TaxProvider - Status: ✅ Complete
* [x] **T06**: Reference Providers - Status: ✅ Complete

<!-- END PROGRESS SECTION -->

---

## Architecture Design
**Status**: ✅ **Complete**

### Goal
Evolve from monolithic adapter to composable, multi-source orchestrator. Add notification and analytics as pluggable providers following the same pattern as PaymentProvider.

### Key Architectural Decision: Domains vs Providers

| Category | What It Is | Pattern | Access |
|---|---|---|---|
| **Domain** | Data source — CRUD on commerce entities | Adapter sub-interface | `orchestrator.catalog.getProduct()` |
| **Provider** | Side-effect service — reacts to events | Event-driven plugin | `commerce.createPayment()` |

**Domains** are registered on the adapter/orchestrator. **Providers** are registered in `createCommerce()` config and wired to the event bus. This distinction is **permanent** — new features always fall into one of these two categories.

### Three-Tier Domain Model

| Tier | Domains | Required? |
|---|---|---|
| **1: Universal** | `catalog`, `store` | ✅ Always present |
| **2: Common** | `cart`, `checkout`, `orders`, `customers`, `wishlist`, `reviews`, `promotions`, `brands`, `countries`, `locations` | Optional |
| **3: Specialized** | `returns`, `wholesale`, `auctions`, `rentals`, `giftCards`, `subscriptions`, `loyalty`, `content` | Optional |

### Provider Registry

| Provider | Purpose | Package |
|---|---|---|
| **PaymentProvider** | Payment processing | `@commercejs/payment-tap` (exists ✅) |
| **NotificationProvider** | Email, SMS, Push, WhatsApp, Telegram | `@commercejs/notification-resend` (new) |
| **AnalyticsProvider** | User tracking & BI | `@commercejs/analytics-ga` (new) |
| **TaxProvider** | Tax calculation | `@commercejs/tax-taxjar` (future) |
| **SearchProvider** | Dedicated search | `@commercejs/search-algolia` (future) |

### Composition Patterns

**A: Composite Orchestrator** — mix domains from multiple providers:
```typescript
createCompositeOrchestrator({ providers: { catalog: shopify, checkout: platform } })
```

**B: Platform Fallback** — auto-fill gaps with native engine:
```typescript
withPlatformFallback(sallaAdapter)  // cart/checkout → Platform
```

**C: Both combined:**
```typescript
withPlatformFallback(createCompositeOrchestrator({ ... }))
```

### Dependencies
- Phase 2 should be substantially complete (DRY extraction, `defineCommerceHandler`)
- `@commercejs/types` — new provider interfaces
- `@commercejs/core` — updated `createCommerce()` config

### Related Files
- `packages/types/src/adapter.ts` — orchestrator interfaces
- `packages/core/src/commerce.ts` — `createCommerce()` factory
- `packages/core/src/events.ts` — event catalog
- `packages/core/src/event-bus.ts` — event bus

---

## Implementation Tasks

### T01: Three-Tier CommerceOrchestrator

**Goal:** Replace `CommerceAdapter` with `CommerceOrchestrator` that supports optional domains.

**New types in `@commercejs/types`:**
- `UniversalDomains` (catalog, store — always required)
- `CommonDomains` (cart?, checkout?, orders?, customers?, etc.)
- `SpecializedDomains` (returns?, wholesale?, etc.)
- `CommerceOrchestrator extends UniversalDomains, CommonDomains, SpecializedDomains`
- `supports<D>(domain): this is Required<Pick<...>>`

### T02: `createCompositeOrchestrator()`

**Goal:** Factory that composes domains from multiple adapter sources.

~50 lines. Each domain slot is independently assignable. Type-safe routing.

### T03: `withPlatformFallback()`

**Goal:** Wrapper that fills missing domains with the Platform adapter.

~40 lines. Iterates all domain keys, uses primary adapter if supported, falls back to Platform.

### T04: NotificationProvider + Event Wiring

**Goal:** Pluggable notification providers that subscribe to commerce events.

**New types:**
- `NotificationProvider` interface (name, channels, send)
- `NotificationChannel` type (email, sms, push_web, push_mobile, whatsapp, telegram)
- `NotificationRule` (event → channel → template)

**Config update:**
```typescript
createCommerce({
  notifications: { email: resendProvider, sms: twilioProvider },
  notificationRules: [{ event: 'order.created', channel: 'email', template: 'order_confirmed' }],
})
```

### T05: AnalyticsProvider + TaxProvider

**Goal:** Analytics tracking and tax calculation as providers.

### T06: Reference Providers ✅

**Goal:** Build at least one reference implementation for each provider type.

- `@commercejs/notification-resend` — Resend email provider
  - `createResendProvider()` with lazy client init, configurable `from`/`replyTo`, template support via `X-Template-Id` header
  - Error handling: never throws, returns `{ success, error }` for all failures
  - 9 unit tests, published to npm, Trusted Publishing configured
- `@commercejs/analytics-ga` — Google Analytics 4 provider
  - `createGA4Provider()` with automatic mapping of 11 CommerceJS events to GA4 recommended events
  - SSR-safe (no-ops when `gtag` unavailable), optional debug mode
  - 12 unit tests, published to npm, Trusted Publishing configured

---

## Verification Plan

### Automated
- [x] Existing contract tests pass with `CommerceOrchestrator` (backward compatible)
- [x] New tests: composite orchestrator routes domains correctly (2 tests)
- [x] New tests: platform fallback fills gaps (5 tests)
- [x] New tests: notification-resend provider (9 tests — metadata, send, errors, channels, templates)
- [x] New tests: analytics-ga provider (12 tests — event mapping, identify, page, SSR safety, debug)

### Manual
- [ ] Configure composite orchestrator in storefront
- [ ] Test Salla + Platform fallback (cart via Platform works)
- [ ] Send test email via notification provider

---

<!-- META_INFORMATION -->
## Change Log

- **2026-02-15**: Phase 3 plan created from v6 API/SDK Evaluation
- **2026-02-16**: T01-T05 implemented and verified. 11 new tests added (51 total core tests pass). Storefront build fix: removed broken relative imports in 46 `_commerce/` handlers, switched to Nitro auto-imports.
- **2026-02-16**: T06 complete — `@commercejs/notification-resend` (9 tests) and `@commercejs/analytics-ga` (12 tests) built, tested, and published to npm. Docs pages added. Phase 3 fully done.
- **2026-02-16**: All 14 package READMEs created/updated (4 new, 3 rewritten, 3 updated). Root README updated with new packages.
<!-- META_INFORMATION -->
