# Phase 2: SDK Quality & DX — Plan

> Harden the SDK with validation, error handling, DRY extraction, and composable improvements.

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [x] **Research & Audit** ✅ Completed
  - Audited all 44 API handlers — identified identical boilerplate pattern
  - Found `parseJsonField` duplicated in 3 domain files
  - Reviewed composable patterns for `$fetch` alignment

* [x] [**T01**: DRY Extraction & `defineCommerceHandler`](tasks/T01.md) - Status: ✅ Completed
* [x] [**T02**: Zod Validation Schemas](tasks/T02.md) - Status: ✅ Completed
* [x] [**T03**: Route Restructure → `addServerScanDir`](tasks/T03.md) - Status: ✅ Completed
* [x] [**T04**: Composable Improvements](tasks/T04.md) - Status: ✅ Completed
* [x] [**T05**: Request-Scoped Context & ULID Orders](tasks/T05.md) - Status: ✅ Completed

<!-- END PROGRESS SECTION -->

---

## Research & Audit
**Status**: 🟡 **Planned**

### Goal
Make the SDK robust, DRY, and developer-friendly without changing the public API surface. All changes are internal refactors — no breaking changes.

### Source
All recommendations come from the [API & SDK Evaluation v6](../../.gemini/antigravity/brain/f2c6b435-9ca5-4f2b-ac88-d81829a701b3/api_sdk_evaluation.md), which identified:
- 🔴 3 critical issues (validation, DRY, multi-adapter architecture)
- 🟡 5 important improvements (routes, composables, error handling, context)
- 🟢 4 nice-to-have enhancements (useOrders, formatting, namespacing, ULID)

### Scope

| Task | Files Changed | Impact |
|---|---|---|
| T01: DRY + `defineCommerceHandler` | ~46 files (44 handlers + 2 new util files) | Error handling centralized |
| T02: Zod Schemas | ~10 new schema files + 20 handler updates | Runtime validation on all mutations |
| T03: Route Restructure | ~44 handler files moved + `module.ts` | Convention-based routing |
| T04: Composable Fixes | ~5 composable files | `$fetch` alignment, `useOrders`, formatting |
| T05: Context + ULID | ~5 files | Request-scoped context, sortable order IDs |

### Dependencies
- `@commercejs/types` — Zod schemas added here
- `@commercejs/nuxt` — handlers, composables, routes restructured here
- `@commercejs/platform` — `parseJsonField` extracted to `helpers.ts`
- `zod` — new dependency for types package
- `ulid` — new dependency for platform package

### Related Files
- `packages/nuxt/src/module.ts` — 44 `addServerHandler` calls → 1 `addServerScanDir`
- `packages/nuxt/src/runtime/server/api/` — all API handlers
- `packages/nuxt/src/runtime/composables/` — all 16 composables
- `packages/types/src/` — schema definitions
- `packages/platform/src/domains/helpers.ts` — shared utilities

---

## Implementation Tasks

### T01: DRY Extraction & `defineCommerceHandler`

**Goal:** Eliminate duplicated error handling and adapter injection across 44 handlers.

**Steps:**
1. Extract `parseJsonField` → `@commercejs/platform/src/domains/helpers.ts`
2. Create `handleError` utility → `@commercejs/nuxt/src/runtime/composables/utils/error.ts`
3. Create `defineCommerceHandler` wrapper → `@commercejs/nuxt/src/runtime/server/utils/handler.ts`
4. Migrate all 44 API handlers to use `defineCommerceHandler`

**Before:**
```typescript
export default defineEventHandler(async (event) => {
  try {
    const adapter = useServerAdapter(event)
    const body = await readBody(event)
    return await adapter.addToCart(body.cartId, body.item)
  } catch (err) {
    if (isCommerceError(err)) {
      throw createError({ statusCode: err.statusCode ?? 500, message: err.message })
    }
    throw createError({ statusCode: 500, message: 'Internal server error' })
  }
})
```

**After:**
```typescript
export default defineCommerceHandler(async (event, adapter) => {
  const body = await readBody(event)
  return adapter.addToCart(body.cartId, body.item)
})
```

### T02: Zod Validation Schemas

**Goal:** Runtime validation on all mutation endpoints.

**Steps:**
1. Add `zod` to `@commercejs/types`
2. Define schemas: `AddToCartSchema`, `SetShippingAddressSchema`, `RegisterSchema`, etc.
3. Replace `readBody` with `readValidatedBody(event, schema.parse)` in mutation handlers
4. Export schemas from `@commercejs/types` barrel

### T03: Route Restructure

**Goal:** Replace manual route registration with Nuxt convention-based routing.

**Steps:**
1. Create directory structure: `runtime/server/api/_commerce/{domain}/[method].ts`
2. Move handlers from flat structure to nested
3. Replace 44 `addServerHandler` calls in `module.ts` with `addServerScanDir`
4. Verify all routes resolve correctly

### T04: Composable Improvements

**Goal:** Align composables with best practices.

**Steps:**
1. Fix `useCustomer` → `$fetch` (currently uses direct adapter, should match `useCart`/`useCheckout`)
2. Create `useOrders` composable (load, cancel, reorder)
3. Namespace `useState` keys to `cartId` for checkout state isolation
4. Upgrade price formatting → `Intl.NumberFormat` with cached formatters

### T05: Request-Scoped Context & ULID Orders

**Goal:** Per-request context and sortable order IDs.

**Steps:**
1. Define `CommerceContext` interface (customerId, locale, currency)
2. Inject context via Nuxt server plugin (from session/headers)
3. Pass context to adapter methods that need user-specific data
4. Replace order number generation with ULID (`ORD-${ulid()}`)

---

## Verification Plan

### Automated
- [ ] All existing contract tests still pass after refactors
- [ ] Build all packages in dependency order (`types → core → platform → nuxt`)
- [ ] Dev server starts and all routes resolve

### Manual
- [ ] Browser test: add to cart, checkout flow, customer login
- [ ] Verify Zod validation rejects bad input with clear errors
- [ ] Verify `useOrders` composable works in storefront

---

<!-- META_INFORMATION -->
## Task Status Legend
- 🔴 **Blocked**: Requires external dependency or decision
- 🟡 **Planned**: Ready to implement
- 🟢 **In Progress**: Currently being worked on
- ✅ **Completed**: Done

## Change Log

- **2026-02-15**: Phase 2 plan created from v6 API/SDK Evaluation recommendations
<!-- META_INFORMATION -->
