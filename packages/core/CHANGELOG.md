# @commercejs/core

## 0.2.1

### Patch Changes

- Updated dependencies [[`e72ed4a`](https://github.com/commerce-js/commerce.js/commit/e72ed4a76e85f8b81e6d285150d152562c2626b9)]:
  - @commercejs/types@0.2.1

## 0.2.0

### Minor Changes

- [`8adbefb`](https://github.com/commerce-js/commerce.js/commit/8adbefbbce1d9c24c55ea2c9e8a6daa7bbb204a5) Thanks [@masterde](https://github.com/masterde)! - Architecture evolution: three-tier orchestrator, multi-adapter composition, and provider interfaces.

  - **@commercejs/types**: Added `CommerceOrchestrator`, `UniversalDomains`, `CommonDomains`, `SpecializedDomains` interfaces. New provider types: `NotificationProvider`, `AnalyticsProvider`, `TaxProvider`.
  - **@commercejs/core**: Added `createOrchestrator()`, `createCompositeOrchestrator()`, and `withPlatformFallback()` factories. Wired notification and analytics providers into `createCommerce()` event bus.
  - **@commercejs/nuxt**: Fixed build failure caused by broken relative imports in 46 API route handlers. Switched to Nitro auto-imports via `addServerScanDir`.
  - **@commercejs/platform**: Minor fixes to cart, checkout, countries, and order domain helpers.

### Patch Changes

- Updated dependencies [[`8adbefb`](https://github.com/commerce-js/commerce.js/commit/8adbefbbce1d9c24c55ea2c9e8a6daa7bbb204a5)]:
  - @commercejs/types@0.2.0
