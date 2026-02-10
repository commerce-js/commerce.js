# Phase 1: Composable Contract & Salla Adapter Completion — Plan

---

### Progress Summary

* [ ] **Research & Strategy Selection** 🟢 In Progress
  - Audit Salla API scope vs implemented adapter methods
  - Design composable adapter architecture
  - Select strategy for contract refactor

* [ ] [**T01**: Refactor CommerceAdapter to CommerceOrchestrator](tasks/T01.md) - Status: 🟡 Planned
* [ ] [**T02**: Implement Missing Salla Adapter Methods](tasks/T02.md) - Status: 🟡 Planned
* [ ] [**T03**: Add createOrder to Adapter Contract](tasks/T03.md) - Status: 🟡 Planned
* [ ] [**T04**: Contract Test Suite](tasks/T04.md) - Status: 🟡 Planned
* [ ] [**T05**: Salla Mapper Unit Tests](tasks/T05.md) - Status: 🟡 Planned

---

## Research & Strategy Selection
**Status**: 🟢 **In Progress**

### Goal
Refactor the adapter contract from monolithic to composable, implement all Salla adapter methods we have API access for, and establish a test suite to prove correctness.

### Context
After validating the first adapter (Salla) and defining the vision (composable orchestrator, Universal Checkout, SoftPOS), Phase 1 makes the foundation trustworthy before building higher-level packages.

### Key Finding: Salla API Scope Audit

From the Salla API permissions screenshot, here is what we have access to vs what's implemented:

| Salla Scope | Permission | Adapter Status | Gap |
|---|---|---|---|
| **Products** | R&W | ✅ `getProduct`, `getProducts` | None |
| **Categories** | R&W | ✅ `getCategories` | None |
| **Brands** | R&W | ✅ `getBrands` | None |
| **Countries** | R&W | ✅ `getCountries` | None |
| **Branches** | R&W | ✅ `getStoreLocations` | None |
| **Basic Information** | Read Only | ✅ `getStoreInfo` | None |
| **Shipping** | R&W | ✅ `getShippingMethods` | None |
| **Payments** | R&W | ✅ `getPaymentMethods` | None |
| **Special Offers** | R&W | ✅ `getActivePromotions`, `validateCoupon` | None |
| **Questions & Reviews** | R&W | ✅ `getProductReviews`, `getReviewSummary`, `submitReview` | None |
| **Orders** | **R&W** | ⚠️ `getOrder`, `getCustomerOrders` only | 🔴 **`createOrder` missing** |
| **Customers** | **R&W** | ⚠️ `register` only | 🔴 **`getCustomer`, `updateCustomer`, addresses missing** |
| **Carts** | **Read Only** | ❌ All stubbed | 🟡 Can read abandoned carts |
| **Webhooks** | R&W | ❌ Not used | 🟡 Future (Event Bus) |
| **Transactions** | R&W | ❌ Not used | 🟡 Future |
| **Taxes** | R&W | ❌ Not used | 🟡 Future (Universal Checkout) |
| **Customer Wallet** | R&W | ❌ Not used | 🟡 Future |
| **Subscriptions** | R&W | ❌ Not used | 🟡 Future |
| **Marketing** | R&W | ❌ Not used | 🟡 Out of scope |
| **Meta Data** | R&W | ❌ Not used | 🟡 Low priority |
| **DNS Management** | Read Only | ❌ Not used | N/A |
| **Settlements** | R&W | ❌ Not used | 🟡 Out of scope |
| **Settings** | R&W | ❌ Not used | 🟡 Low priority |
| **Exports** | R&W | ❌ Not used | 🟡 Out of scope |

**Bottom line**: We have R&W for **Orders** and **Customers** and we're barely using them. `createOrder` and customer CRUD are the biggest missed opportunities.

### Strategy Proposals

**Option A: Monolithic Refactor + Full Salla Implementation**
- Refactor `CommerceAdapter` to composable orchestrator
- Implement ALL missing Salla methods where API access exists
- Add contract test suite + mapper tests
- Pros: Complete coverage, maximum value from Salla integration
- Cons: Large scope, risk of scope creep

**Option B: Focused Refactor + Critical Salla Methods Only**
- Refactor `CommerceAdapter` to composable orchestrator
- Implement only critical missing methods: `createOrder`, `getCustomer`, `updateCustomer`, customer addresses
- Skip low-priority scopes (Marketing, DNS, Settlements, Exports)
- Add contract test suite + mapper tests
- Pros: Focused, ships faster, covers the transactional gap
- Cons: Leaves some adapter methods stubbed

**Option C: Test-First, Then Refactor**
- Write contract tests + mapper tests against current code first
- Then refactor adapter contract with safety net in place
- Then implement missing Salla methods
- Pros: Safest approach, catch regressions during refactor
- Cons: Tests written against old contract may need updating after refactor

### Selected Approach

> **IMPORTANT**: Awaiting user confirmation

**Recommendation: Option B (Focused Refactor + Critical Methods)**

**Rationale**:
- `createOrder` is the single most important missing method — it completes the Salla-only storefront scenario
- Customer CRUD enables auth flows
- Low-priority scopes (Marketing, DNS, Exports) don't help the storefront use case
- Contract tests should come after the refactor (no point testing the old monolithic shape)

**Implementation Plan**:
1. Refactor `CommerceAdapter` → composable `CommerceOrchestrator` in `@commercejs/types`
2. Add `createOrder(input)` to adapter contract (separate from `placeOrder`)
3. Implement `createOrder`, `getCustomer`, `updateCustomer`, address methods in Salla adapter
4. Add new Salla raw types and mappers for customer and order creation
5. Write contract test suite that validates any adapter against sub-interfaces
6. Write unit tests for all 11+ Salla mappers
7. Update `@commercejs/core` composables to work with orchestrator pattern

### Dependencies
- Salla API access (confirmed ✅ — R&W on Orders, Customers)
- TypeScript strict mode for type safety
- Vitest for testing (need to set up)

### Related Files
- `packages/types/src/adapter.ts` — adapter contract (main refactor target)
- `packages/adapter-salla/src/adapter.ts` — Salla implementation
- `packages/adapter-salla/src/types.ts` — Salla raw types
- `packages/adapter-salla/src/mappers/` — 11 mapper files
- `packages/adapter-salla/src/client.ts` — HTTP client
- `packages/core/src/runtime/composables/` — 16 composable files

---

## Verification Plan

### Automated Tests
- `vitest run` — run contract tests against Salla adapter
- `vitest run --coverage` — check mapper test coverage
- `npx tsc --noEmit` — verify TypeScript compilation after refactor

### Manual Verification
- Build all packages: `pnpm build` across monorepo
- Start storefront dev server: `cd packages/storefront && npx nuxt dev`
- Verify existing pages still work (product listing, product detail)
- Test new `createOrder` method against live Salla API (if safe to do so)

---

## Lessons Learned (Post-Implementation)
> Fill this section out after completing the feature

---

## Change Log

- **2026-02-09 12:01**: Phase 1 plan created based on Salla API scope audit
