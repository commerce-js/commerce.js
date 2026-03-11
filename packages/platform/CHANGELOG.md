# @commercejs/platform

## 0.5.4

### Patch Changes

- [`ad1dfca`](https://github.com/commerce-js/commerce.js/commit/ad1dfca39a7c3a58630cbaff828e14c67c8410be) Thanks [@masterde](https://github.com/masterde)! - Serialize catalog queries for Cloudflare Workers compatibility.

  The Drizzle ORM neon-http driver fails on parallel queries (Promise.all) on
  Cloudflare Workers with "Failed query" errors. Switched to sequential queries
  in fetchProductRelations, getProducts, and findProducts.

## 0.5.3

### Patch Changes

- [`47e887b`](https://github.com/commerce-js/commerce.js/commit/47e887bfb0d087b35931f665fa131d5097f9e3af) Thanks [@masterde](https://github.com/masterde)! - Fix Drizzle + @neondatabase/serverless v1.x compatibility on Cloudflare Workers.

  The `drizzle(connectionString)` shorthand internally uses a `client.query ?? client`
  fallback that is incompatible with @neondatabase/serverless v1.x, causing parallel
  queries (via Promise.all) to fail with "Failed query" errors. Fixed by explicitly
  creating the `neon()` HTTP client and passing it to `drizzle({ client, schema })`.

## 0.5.2

### Patch Changes

- [`a344101`](https://github.com/commerce-js/commerce.js/commit/a3441011a7542b3bfa637d1c472084f1b6ac275e) Thanks [@masterde](https://github.com/masterde)! - Move @neondatabase/serverless from peerDependencies to regular dependencies. This ensures the Neon driver is always installed with the package, fixing Cloudflare Pages builds where externals are not allowed.

## 0.5.1

### Patch Changes

- [`75eed48`](https://github.com/commerce-js/commerce.js/commit/75eed480a947319e21bcfe5e3ce9b9cf876ccbe1) Thanks [@masterde](https://github.com/masterde)! - Extract database migrations from runtime cold start to Cloudflare build phase. Add `db:migrate` and `db:migrate:seed` npm scripts. Remove `migrateDrizzle()` from server plugin startup.

## 0.5.0

### Minor Changes

- [`b28e4fc`](https://github.com/commerce-js/commerce.js/commit/b28e4fcb5e922c2a6dc4587bdebfa66c5af227e5) Thanks [@masterde](https://github.com/masterde)! - Cloud deployment readiness

  - **@commercejs/nuxt**: Adapter plugin now detects `DATABASE_URL` for Neon Postgres and calls the correct migration function (`migrateNeon` for Postgres, `migratePrisma` for SQLite). Added admin auth dev-mode bypass, new admin API endpoints for orders and products by ID.
  - **@commercejs/platform**: Admin API enhancements — added `getProduct`, `getOrder`, `fulfillOrder`, `refundOrder`, `deleteProduct` methods. Added `seedInitialAdmin` for DB-backed admin users.

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
