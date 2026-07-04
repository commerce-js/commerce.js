# Phase 1: Composable Contract & Salla Adapter Completion — Plan

---

### Progress Summary

* [x] **Research & Strategy Selection** ✅ Completed
  - Audited Salla API scope vs implemented adapter methods
  - Designed composable adapter architecture
  - Selected Option B: Focused Refactor + Critical Salla Methods

* [x] [**T01**: Refactor CommerceAdapter to composable sub-interfaces](tasks/T01.md) - Status: ✅ Completed
* [x] [**T02**: Implement Missing Salla Adapter Methods](tasks/T02.md) - Status: ✅ Completed
* [x] [**T03**: Add createOrder to Adapter Contract](tasks/T03.md) - Status: ✅ Completed
* [x] [**T04**: Contract Test Suite](tasks/T04.md) - Status: ✅ Completed
* [x] [**T05**: Salla Mapper Unit Tests](tasks/T05.md) - Status: ✅ Completed

---

## Research & Strategy Selection
**Status**: ✅ **Completed**

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
| **Orders** | R&W | ✅ `createOrder`, `getOrder`, `getCustomerOrders`, `getOrderStatuses`, `updateOrderStatus`, `cancelOrder`, `duplicateOrder`, `getOrderHistory` | None |
| **Customers** | R&W | ✅ `register`, `getCustomer`, `updateCustomer`, `logout`, `forgotPassword`, `resetPassword`, `getAddresses`, `addAddress`, `updateAddress`, `deleteAddress` | None |
| **Carts** | Read Only | ❌ All stubbed | 🟡 Can read abandoned carts |
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

### Selected Approach

**Decision**: Option B — Focused Refactor + Critical Methods

**Outcome**: Exceeded original scope — implemented 15 composable sub-interfaces (vs 5–6 planned) and full customer CRUD + order management.

### Dependencies
- Salla API access (confirmed ✅ — R&W on Orders, Customers)
- TypeScript strict mode for type safety
- Vitest for testing

### Related Files
- `packages/types/src/adapter.ts` — 15 composable sub-interfaces + `CommerceAdapter` union
- `packages/adapter-salla/src/adapter.ts` — 658-line implementation (all methods)
- `packages/adapter-salla/src/types.ts` — Salla raw types
- `packages/adapter-salla/src/mappers/` — 12 mapper files
- `packages/adapter-salla/src/client.ts` — HTTP client with token refresh
- `packages/adapter-salla/src/__tests__/adapter.contract.test.ts` — 258-line contract test
- `packages/adapter-salla/src/__tests__/mappers.test.ts` — 592-line mapper tests
- `packages/nuxt/src/runtime/composables/` — 16 composable files

---

## Verification Results

### Automated Tests
- ✅ Contract tests pass — identity, supported methods, NOT_SUPPORTED methods, capabilities consistency
- ✅ Mapper tests pass — 10 mappers with fixtures covering edge cases (null fields, date formats, status slug mapping)

### Manual Verification
- ✅ All packages build successfully (`pnpm turbo run build`)
- ✅ Storefront dev server starts and loads data from Salla API

---

## Lessons Learned (Post-Implementation)

### What Went Well
- Composable sub-interface pattern scales cleanly — adding new domains (wholesale, auction, rental) was straightforward
- Mock-based contract tests catch NOT_SUPPORTED consistency without real API calls
- Mapper tests with comprehensive fixtures prevent regressions

### What Could Be Improved
- Plan tracking fell out of sync — tasks were completed but plan files never updated
- Added a protocol to the CommerceJS skill to enforce plan updates after task completion

---

<!-- META_INFORMATION -->
## Change Log

- **2026-02-09 12:01**: Phase 1 plan created based on Salla API scope audit
- **2026-02-15**: Plan synced with codebase — all tasks marked ✅ Completed. Scope exceeded original plan.
<!-- META_INFORMATION -->
