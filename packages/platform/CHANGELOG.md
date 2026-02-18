# @commercejs/platform

## 0.4.0

### Minor Changes

- [`8a22683`](https://github.com/commerce-js/commerce.js/commit/8a226839b66c4579b1989eebfa650d1a4fada0b4) Thanks [@masterde](https://github.com/masterde)! - ### Admin Auth: DB-backed admin users

  - Added `admin_users` table across all 3 database drivers (Prisma, Drizzle, Neon)
  - Added `AdminUser` / `AdminUserSafe` types
  - New `admin.auth` domain: `login`, `changePassword`, `createAdmin`, `listAdmins`, `deleteAdmin`, `seedInitialAdmin`
  - Password hashing with `bcrypt-ts` (matches customer auth)
  - Auto-seed initial admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars on first startup
  - Login route (`POST /admin/auth/login`) now validates against the database
  - New change-password route (`POST /admin/auth/change-password`)
  - Session `User` type now includes `id` and `name` fields

## 0.3.2

### Patch Changes

- Updated dependencies [[`3c539a5`](https://github.com/commerce-js/commerce.js/commit/3c539a51746d02d2643b25a5dbb041abc143928b)]:
  - @commercejs/types@0.3.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`e72ed4a`](https://github.com/commerce-js/commerce.js/commit/e72ed4a76e85f8b81e6d285150d152562c2626b9)]:
  - @commercejs/types@0.2.1

## 0.3.0

### Minor Changes

- [`4862435`](https://github.com/commerce-js/commerce.js/commit/486243593c6fea617f5c1626af5484a0ea386ce8) Thanks [@masterde](https://github.com/masterde)! - Add Neon Postgres driver and async adapter auto-detection

  - Neon driver: `initPrismaNeon()` using `@neondatabase/serverless` + `@prisma/adapter-neon`
  - `createPlatformAdapter()` is now async with automatic driver detection from `DATABASE_URL`
  - New config options: `driver` (`'sqlite'` | `'neon'`) and `connectionString`

## 0.2.1

### Patch Changes

- [`8adbefb`](https://github.com/commerce-js/commerce.js/commit/8adbefbbce1d9c24c55ea2c9e8a6daa7bbb204a5) Thanks [@masterde](https://github.com/masterde)! - Architecture evolution: three-tier orchestrator, multi-adapter composition, and provider interfaces.

  - **@commercejs/types**: Added `CommerceOrchestrator`, `UniversalDomains`, `CommonDomains`, `SpecializedDomains` interfaces. New provider types: `NotificationProvider`, `AnalyticsProvider`, `TaxProvider`.
  - **@commercejs/core**: Added `createOrchestrator()`, `createCompositeOrchestrator()`, and `withPlatformFallback()` factories. Wired notification and analytics providers into `createCommerce()` event bus.
  - **@commercejs/nuxt**: Fixed build failure caused by broken relative imports in 46 API route handlers. Switched to Nitro auto-imports via `addServerScanDir`.
  - **@commercejs/platform**: Minor fixes to cart, checkout, countries, and order domain helpers.

- Updated dependencies [[`8adbefb`](https://github.com/commerce-js/commerce.js/commit/8adbefbbce1d9c24c55ea2c9e8a6daa7bbb204a5)]:
  - @commercejs/types@0.2.0

## 0.2.0

### Minor Changes

- [`0a3a167`](https://github.com/commerce-js/commerce.js/commit/0a3a1678bcc1f22607da15ff207efcee309d89c2) Thanks [@masterde](https://github.com/masterde)! - feat(platform): polish Tier 1 domains — seed data, review distribution, promotions & returns

  - Add seed data for brands (3), countries (6 GCC), and reviews (6) to both Drizzle and Prisma seeds
  - Implement `getReviewDistribution` query to compute actual star breakdowns (was hardcoded `[0,0,0,0,0]`)
  - Wire promotions domain (`getActivePromotions`, `validateCoupon`) and returns domain (`createReturn`, `getReturn`, `getReturns`, `getOrderReturns`, `cancelReturn`) into adapter
  - Remove duplicate `applyCoupon` from promotions (cart owns it)
  - Add comprehensive README, docs site page, and updated API reference
