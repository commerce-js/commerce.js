# @commercejs/nuxt

## 0.3.1

### Patch Changes

- Updated dependencies [[`3c539a5`](https://github.com/commerce-js/commerce.js/commit/3c539a51746d02d2643b25a5dbb041abc143928b)]:
  - @commercejs/types@0.3.0
  - @commercejs/adapter-salla@0.1.3
  - @commercejs/platform@0.3.2

## 0.3.0

### Minor Changes

- [`e72ed4a`](https://github.com/commerce-js/commerce.js/commit/e72ed4a76e85f8b81e6d285150d152562c2626b9) Thanks [@masterde](https://github.com/masterde)! - feat(nuxt): add OpenAPI spec generation via Nitro experimental.openAPI

  - Enable `experimental.openAPI` in module config with Scalar UI theme
  - Add `defineRouteMeta` to all 46 server routes with tags, descriptions, and parameters
  - Routes organized into 13 OpenAPI tags: Store, Catalog, Geography, Auth, Cart, Checkout, Customer, Addresses, Orders, Reviews, Wishlist, Returns, Promotions
  - Auto-generated spec at `/_openapi.json`, interactive docs at `/_scalar`

  fix(types): add CONFIGURATION_ERROR to CommerceErrorCode union

### Patch Changes

- Updated dependencies [[`e72ed4a`](https://github.com/commerce-js/commerce.js/commit/e72ed4a76e85f8b81e6d285150d152562c2626b9)]:
  - @commercejs/types@0.2.1
  - @commercejs/adapter-salla@0.1.2
  - @commercejs/platform@0.3.1

## 0.2.2

### Patch Changes

- Updated dependencies [[`4862435`](https://github.com/commerce-js/commerce.js/commit/486243593c6fea617f5c1626af5484a0ea386ce8)]:
  - @commercejs/platform@0.3.0

## 0.2.1

### Patch Changes

- [`8adbefb`](https://github.com/commerce-js/commerce.js/commit/8adbefbbce1d9c24c55ea2c9e8a6daa7bbb204a5) Thanks [@masterde](https://github.com/masterde)! - Architecture evolution: three-tier orchestrator, multi-adapter composition, and provider interfaces.

  - **@commercejs/types**: Added `CommerceOrchestrator`, `UniversalDomains`, `CommonDomains`, `SpecializedDomains` interfaces. New provider types: `NotificationProvider`, `AnalyticsProvider`, `TaxProvider`.
  - **@commercejs/core**: Added `createOrchestrator()`, `createCompositeOrchestrator()`, and `withPlatformFallback()` factories. Wired notification and analytics providers into `createCommerce()` event bus.
  - **@commercejs/nuxt**: Fixed build failure caused by broken relative imports in 46 API route handlers. Switched to Nitro auto-imports via `addServerScanDir`.
  - **@commercejs/platform**: Minor fixes to cart, checkout, countries, and order domain helpers.

- Updated dependencies [[`8adbefb`](https://github.com/commerce-js/commerce.js/commit/8adbefbbce1d9c24c55ea2c9e8a6daa7bbb204a5)]:
  - @commercejs/types@0.2.0
  - @commercejs/platform@0.2.1
  - @commercejs/adapter-salla@0.1.1
