# @commercejs/types

## 0.3.0

### Minor Changes

- [`3c539a5`](https://github.com/commerce-js/commerce.js/commit/3c539a51746d02d2643b25a5dbb041abc143928b) Thanks [@masterde](https://github.com/masterde)! - feat: add StorageProvider interface and S3-compatible storage provider

  - **@commercejs/types**: New `StorageProvider` interface with `upload`, `delete`, `getUrl`, `getPresignedUploadUrl`, and `getPresignedDownloadUrl` methods
  - **@commercejs/storage-s3**: New package — S3-compatible storage provider using `aws4fetch`, works with AWS S3, Cloudflare R2, DigitalOcean Spaces, and MinIO
  - **@commercejs/core**: Added `storage` config option and storage methods to `CommerceInstance`

## 0.2.1

### Patch Changes

- [`e72ed4a`](https://github.com/commerce-js/commerce.js/commit/e72ed4a76e85f8b81e6d285150d152562c2626b9) Thanks [@masterde](https://github.com/masterde)! - feat(nuxt): add OpenAPI spec generation via Nitro experimental.openAPI

  - Enable `experimental.openAPI` in module config with Scalar UI theme
  - Add `defineRouteMeta` to all 46 server routes with tags, descriptions, and parameters
  - Routes organized into 13 OpenAPI tags: Store, Catalog, Geography, Auth, Cart, Checkout, Customer, Addresses, Orders, Reviews, Wishlist, Returns, Promotions
  - Auto-generated spec at `/_openapi.json`, interactive docs at `/_scalar`

  fix(types): add CONFIGURATION_ERROR to CommerceErrorCode union

## 0.2.0

### Minor Changes

- [`8adbefb`](https://github.com/commerce-js/commerce.js/commit/8adbefbbce1d9c24c55ea2c9e8a6daa7bbb204a5) Thanks [@masterde](https://github.com/masterde)! - Architecture evolution: three-tier orchestrator, multi-adapter composition, and provider interfaces.

  - **@commercejs/types**: Added `CommerceOrchestrator`, `UniversalDomains`, `CommonDomains`, `SpecializedDomains` interfaces. New provider types: `NotificationProvider`, `AnalyticsProvider`, `TaxProvider`.
  - **@commercejs/core**: Added `createOrchestrator()`, `createCompositeOrchestrator()`, and `withPlatformFallback()` factories. Wired notification and analytics providers into `createCommerce()` event bus.
  - **@commercejs/nuxt**: Fixed build failure caused by broken relative imports in 46 API route handlers. Switched to Nitro auto-imports via `addServerScanDir`.
  - **@commercejs/platform**: Minor fixes to cart, checkout, countries, and order domain helpers.
