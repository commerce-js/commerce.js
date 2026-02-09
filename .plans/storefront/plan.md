# CommerceJS Storefront — Plan

> A premium Nuxt 3 + Nuxt UI v4 storefront app that showcases the `@commercejs/core` module.

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [ ] **Research & Strategy Selection** 🟢 In Progress
  - Review available skills (nuxt, nuxt-ui, nuxt-modules)
  - Evaluate scope: MVP vs full-featured
  - Define page structure and design system
  - Select and document strategy

* [ ] [**T01**: Scaffold Nuxt App](tasks/T01.md) - Status: 🟡 Planned
* [ ] [**T02**: Layout, Theme & Design System](tasks/T02.md) - Status: 🟡 Planned
* [ ] [**T03**: Homepage](tasks/T03.md) - Status: 🟡 Planned
* [ ] [**T04**: Product Listing & Category Pages](tasks/T04.md) - Status: 🟡 Planned
* [ ] [**T05**: Product Detail Page](tasks/T05.md) - Status: 🟡 Planned
* [ ] [**T06**: Cart & Checkout](tasks/T06.md) - Status: 🟡 Planned
* [ ] [**T07**: Build & E2E Validation](tasks/T07.md) - Status: 🟡 Planned

<!-- END PROGRESS SECTION -->

---

## Research & Strategy Selection
**Status**: 🟢 **In Progress**

### Goal
Build a premium, Salla-powered storefront that demonstrates the full CommerceJS SDK. The app will be a package in the existing monorepo (`packages/storefront`) and use `@commercejs/core` for all data.

### Context
- **SDK**: `@commercejs/core` provides 15 composables and 38 API routes
- **Adapter**: `@commercejs/adapter-salla` connects to a real Salla store
- **UI Library**: Nuxt UI v4 (125+ components with Tailwind Variants)
- **Skills**: `nuxt`, `nuxt-ui`, `nuxt-modules` provide comprehensive guidance

### Key Findings

1. **Nuxt UI v4** gives us:
   - Layout components: `UHeader`, `UFooter`, `UMain`, `UContainer`, `UPage`
   - Navigation: `UNavigationMenu`, `UBreadcrumb`, `UPagination`, `UTabs`
   - Data display: `UCard`, `UTable`, `UCarousel`, `UAccordion`
   - Overlays: `UModal`, `UDrawer`, `USlideover`, `UToast`
   - Forms: `UInput`, `USelect`, `USelectMenu`, `UForm`
   - Semantic colors + dark mode out of the box

2. **Composable inventory** (15 available):
   - `useProducts`, `useProduct`, `useCategories`, `useCart`, `useCustomer`
   - `useCheckout`, `useWishlist`, `useReviews`, `useStoreInfo`
   - `usePromotions`, `useReturns`, `useBrands`, `useCountries`, `useLocations`

3. **Direction**: Build a polished MVP storefront covering the core shopping flow:
   Home → Browse Categories → Product Listing → Product Detail → Cart → Checkout

### Strategy Proposals

**Option A: Monorepo Package (Recommended)**
- Create `packages/storefront` as a Nuxt 3 app in the workspace
- Uses `@commercejs/core` as a Nuxt module
- Shares types via `@commercejs/types`
- Pros: Clean integration, showcases SDK properly, reusable
- Cons: Slightly more setup

**Option B: Standalone App**
- Create a separate directory outside the monorepo
- Installs packages from npm
- Pros: Tests real installation flow
- Cons: Packages aren't published yet, would need `file:` links

### Selected Approach

**Decision**: Option A — Monorepo Package

**Rationale**: The packages aren't published yet, so keeping it in the workspace gives us `pnpm` workspace resolution. It also serves as a living demo and integration test for the SDK.

**Pages**:

| Route | Page | Composables Used |
|---|---|---|
| `/` | Homepage | `useStoreInfo`, `useProducts`, `useCategories`, `useBrands` |
| `/products` | Product listing (with filters) | `useProducts`, `useCategories`, `useBrands` |
| `/products/[id]` | Product detail | `useProduct`, `useReviews` |
| `/categories/[id]` | Category products | `useProducts`, `useCategories` |
| `/cart` | Shopping cart | `useCart` |
| `/checkout` | Checkout flow | `useCheckout`, `useCountries` |

**Design System**:
- Primary color: `indigo` (premium feel)
- Dark mode enabled
- Nuxt UI `UHeader` + `UFooter` layout
- Arabic/RTL-ready (Salla stores are typically Arabic)

### Dependencies
- `@commercejs/core` (Nuxt module)
- `@nuxt/ui` (v4)
- `@nuxt/image` (for product images)

### Related Files
- `packages/core/src/module.ts` — Core Nuxt module
- `packages/core/src/runtime/composables/` — All 15 composables

---

## Implementation Tasks

> Task files are in the `tasks/` subfolder.

---

## Lessons Learned (Post-Implementation)

> Fill after completing

---

<!-- META_INFORMATION -->
## Task Status Legend
- 🔴 **Blocked**: Requires external dependency or decision
- 🟡 **Planned**: Ready to implement
- 🟢 **In Progress**: Currently being worked on
- ✅ **Completed**: Done

## Change Log

- **2026-02-08 14:36**: Initial plan setup, skills reviewed
- **2026-02-08 14:36**: Strategy selected — monorepo package with Nuxt UI v4
<!-- META_INFORMATION -->
