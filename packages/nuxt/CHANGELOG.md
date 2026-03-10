# @commercejs/nuxt

## 0.6.8

### Patch Changes

- [`721c842`](https://github.com/commerce-js/commerce.js/commit/721c842b2c701a2ac43c0216349c172f0e128a1a) Thanks [@masterde](https://github.com/masterde)! - Rewrite relative imports to absolute paths in generated route templates

  Fixes CF Workers deploy by combining template generation (addTemplate),
  absolute import path rewriting, and nitro.externals.inline to ensure
  all route handler dependencies are properly bundled.

## 0.6.7

### Patch Changes

- [`f9b5b01`](https://github.com/commerce-js/commerce.js/commit/f9b5b01f9e6f58626192b375c277f8f9e82f74ac) Thanks [@masterde](https://github.com/masterde)! - Generate route handlers as virtual templates for CF Workers compatibility

  Route handlers are now generated as template files in .nuxt/ at build time
  instead of pointing to pre-compiled files in node_modules. This resolves
  Rollup's inability to resolve relative imports between node_modules files
  during Nitro's CF Workers bundling.

## 0.6.6

### Patch Changes

- [`a3b4700`](https://github.com/commerce-js/commerce.js/commit/a3b4700ccbda174c7c94ea8c7429211504623289) Thanks [@masterde](https://github.com/masterde)! - Add .js extensions to relative imports for CF Workers ESM resolution

  Post-build script patches compiled .js files to include explicit .js
  extensions on relative imports, matching @nuxt/module-builder@1.x
  behavior. Required for ESM resolution in Cloudflare Workers.

## 0.6.5

### Patch Changes

- [`9f1a626`](https://github.com/commerce-js/commerce.js/commit/9f1a626184e22b5988e21008b909285e0a40808b) Thanks [@masterde](https://github.com/masterde)! - Revert to original relative imports with nitro.externals.inline

  Restores the original relative import paths and relies solely on
  `nitro.externals.inline` to force Nitro to bundle the module. This
  is the correct minimal fix — one config hook in module.ts.

## 0.6.4

### Patch Changes

- [`9a3bc5b`](https://github.com/commerce-js/commerce.js/commit/9a3bc5bb5ea2f15aaec57b7953a483a9e1bb6444) Thanks [@masterde](https://github.com/masterde)! - Force Nitro to inline @commercejs/nuxt runtime for CF Workers

  Add nitro:config hook that pushes @commercejs/nuxt to
  nitro.externals.inline. Without this, Nitro externalizes
  node_modules by default, causing `defineCommerceHandler is not
defined` on Cloudflare Workers and other edge runtimes.

## 0.6.3

### Patch Changes

- [`a2d7445`](https://github.com/commerce-js/commerce.js/commit/a2d744549801797dc7ecbef3af6d9226d02f28b0) Thanks [@masterde](https://github.com/masterde)! - Add .js extension to handler import path for Nitro compatibility

  Route files import defineCommerceHandler from the package exports path
  but Nitro requires the `.js` extension to resolve the file from
  node_modules. Changes import to
  `@commercejs/nuxt/runtime/server/utils/handler.js`.

## 0.6.2

### Patch Changes

- [`a518dd1`](https://github.com/commerce-js/commerce.js/commit/a518dd1b508d02f636ca057cef856965c54c9c79) Thanks [@masterde](https://github.com/masterde)! - Make handler self-contained for Cloudflare Workers compatibility

  Inline `useServerAdapter` and `createCommerceContext` directly into `handler.ts` to eliminate all cross-file imports. Route files now import `defineCommerceHandler` via the package exports path (`@commercejs/nuxt/runtime/server/utils/handler`) — a real npm-resolvable path that Nitro can always bundle.

  Fixes `defineCommerceHandler is not defined` on CF Workers deploy.

## 0.6.1

### Patch Changes

- [`4b391ad`](https://github.com/commerce-js/commerce.js/commit/4b391ad78cc4986113d37dc9916c518bae97abe7) Thanks [@masterde](https://github.com/masterde)! - Fix route handler imports for Cloudflare Workers compatibility

  Replace relative imports (`../utils/handler`) with `#imports` across all 74 route files and `handler.ts`. This fixes the "Cannot resolve ../utils/handler and externals are not allowed" build error when Nitro bundles the module for Cloudflare Workers.

## 0.5.3

### Patch Changes

- [`31c5688`](https://github.com/commerce-js/commerce.js/commit/31c5688e1e048dc579c4d8dd5956c5be8a7d3444) Thanks [@masterde](https://github.com/masterde)! - Fix `defineNitroPlugin is not defined` error when deploying to Cloudflare Pages.
  Added explicit import from `nitropack/runtime` since Nitro auto-imports don't work for published packages at runtime.

## 0.5.2

### Patch Changes

- Updated dependencies [[`a344101`](https://github.com/commerce-js/commerce.js/commit/a3441011a7542b3bfa637d1c472084f1b6ac275e)]:
  - @commercejs/platform@0.5.2

## 0.5.1

### Patch Changes

- [`75eed48`](https://github.com/commerce-js/commerce.js/commit/75eed480a947319e21bcfe5e3ce9b9cf876ccbe1) Thanks [@masterde](https://github.com/masterde)! - Extract database migrations from runtime cold start to Cloudflare build phase. Add `db:migrate` and `db:migrate:seed` npm scripts. Remove `migrateDrizzle()` from server plugin startup.

- Updated dependencies [[`75eed48`](https://github.com/commerce-js/commerce.js/commit/75eed480a947319e21bcfe5e3ce9b9cf876ccbe1)]:
  - @commercejs/platform@0.5.1

## 0.5.0

### Minor Changes

- [`b28e4fc`](https://github.com/commerce-js/commerce.js/commit/b28e4fcb5e922c2a6dc4587bdebfa66c5af227e5) Thanks [@masterde](https://github.com/masterde)! - Cloud deployment readiness

  - **@commercejs/nuxt**: Adapter plugin now detects `DATABASE_URL` for Neon Postgres and calls the correct migration function (`migrateNeon` for Postgres, `migratePrisma` for SQLite). Added admin auth dev-mode bypass, new admin API endpoints for orders and products by ID.
  - **@commercejs/platform**: Admin API enhancements — added `getProduct`, `getOrder`, `fulfillOrder`, `refundOrder`, `deleteProduct` methods. Added `seedInitialAdmin` for DB-backed admin users.

### Patch Changes

- Updated dependencies [[`b28e4fc`](https://github.com/commerce-js/commerce.js/commit/b28e4fcb5e922c2a6dc4587bdebfa66c5af227e5)]:
  - @commercejs/platform@0.5.0

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

### Patch Changes

- Updated dependencies [[`8a22683`](https://github.com/commerce-js/commerce.js/commit/8a226839b66c4579b1989eebfa650d1a4fada0b4)]:
  - @commercejs/platform@0.4.0

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
