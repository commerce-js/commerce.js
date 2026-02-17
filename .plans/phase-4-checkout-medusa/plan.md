# Phase 4: Universal Checkout + Second Adapter — Plan

> Checkout state machine + Medusa V2 adapter proving type system portability.

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [x] **Checkout State Machine** ✅ Complete
  - Cart → address → shipping → payment → confirm flow — implemented
  - Payment gateway registry (pluggable providers) — implemented

* [x] **T01**: Medusa Adapter Scaffolding - Status: ✅ Complete
* [x] **T02**: Medusa API Client - Status: ✅ Complete
* [x] **T03**: Medusa Mappers (7 modules) - Status: ✅ Complete
* [x] **T04**: Medusa Adapter Class (7 domains) - Status: ✅ Complete
* [x] **T05**: Contract Tests (44 tests) - Status: ✅ Complete
* [ ] **T06**: Channel-agnostic Checkout - Status: 🔲 Not Started
* [ ] **T07**: Embeddable Checkout - Status: 🔲 Not Started

<!-- END PROGRESS SECTION -->

---

## Medusa Adapter (`@commercejs/adapter-medusa`) ✅

### Goal
Build a second adapter implementing the `CommerceAdapter` contract against Medusa V2's Store API. This proves that the type system is truly portable across architecturally distinct backends.

### Architecture Comparison

| Aspect | Salla | Medusa |
|---|---|---|
| **API Style** | REST + OAuth | REST + Publishable API Key |
| **Cart** | ❌ Not supported | ✅ Full CRUD + checkout |
| **Checkout** | ❌ Hosted only | ✅ API-based (cart completion) |
| **Auth** | OAuth access tokens | JWT via `/auth/customer/emailpass` |
| **Products** | Variants optional | Variants always required |
| **Store Info** | `/store/info` endpoint | Derived from `/regions` |
| **Prices** | Major units (10.00) | Minor units (1000 = $10.00) |
| **Pagination** | `page/per_page` | `offset/limit` |

### Package Structure

```
packages/adapter-medusa/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts              # Barrel export
    ├── types.ts              # 25+ raw Medusa API types
    ├── client.ts             # HTTP client (ofetch, auth, pagination)
    ├── adapter.ts            # MedusaAdapter (7 supported, 10 unsupported domains)
    ├── mappers/
    │   ├── index.ts          # Barrel export
    │   ├── product.ts        # MedusaProduct → Product (variants, prices, options)
    │   ├── category.ts       # MedusaProductCategory → Category (recursive)
    │   ├── cart.ts           # MedusaCart → Cart (items, totals, shipping, payment)
    │   ├── customer.ts       # MedusaCustomer → Customer + Address
    │   ├── order.ts          # MedusaOrder → Order (status mapping, fulfillment)
    │   ├── region.ts         # MedusaRegion → StoreInfo + Country
    │   └── shipping.ts       # MedusaShippingOption → ShippingMethod
    └── __tests__/
        └── adapter.contract.test.ts  # 44 passing contract tests
```

### Key Design Decisions

1. **`variantId` required for `addToCart`** — Medusa products always have variants; adapter throws `VALIDATION` error if missing
2. **`defaultRegionId` in config** — Medusa requires a `region_id` for cart creation
3. **Auth flow** — `/auth/customer/emailpass` for login/register, JWT stored in client
4. **Store info from regions** — Medusa has no `/store/info`; derived from `/store/regions`
5. **Minor unit conversion** — All amounts divided by 100, formatted via `Intl.NumberFormat`
6. **Unsupported domains** — All throw `CommerceError` with `NOT_SUPPORTED` (501)

### Dependencies
- `@commercejs/types` — adapter contract
- `ofetch` — HTTP client

---

## Remaining Work

### T06: Channel-Agnostic Checkout
**Status**: 🔲 Not Started

Make the checkout state machine support multiple channels (web, mobile, POS, AI agent) without channel-specific logic.

### T07: Embeddable Checkout
**Status**: 🔲 Not Started

Single line of code to embed checkout in any frontend.

---

## Verification Results

### Automated
- [x] TypeScript typecheck — clean (`tsc --noEmit`)
- [x] Build — clean (`tsc` emits to `dist/`)
- [x] Contract tests — 44/44 passing (identity, 7 domains, 18 unsupported methods)
- [x] Registered in root `vitest.config.ts` projects + coverage

### Manual
- [ ] Connect to a real Medusa V2 instance
- [ ] Run storefront with Medusa adapter (swap `adapter-salla`)

---

<!-- META_INFORMATION -->
## Change Log

- **2026-02-16**: Phase 4 plan created. Medusa adapter fully implemented: 14 source files, 7 domains, 7 mappers, 44 contract tests. Checkout state machine items carried forward from prior roadmap entries.
- **2026-02-17**: Added `FulfillmentType` to `ShippingMethod` type — `'shipping' | 'local_delivery' | 'pickup'` union + `estimatedMinutes?`. Updated all adapter mappers (Salla + Medusa), platform engine, and storefront UI. Prepares the type system for Armada/Parcel delivery provider integration.
<!-- META_INFORMATION -->
