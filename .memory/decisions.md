# Decisions

## 2026-02-20: Keep Prisma at parity with Drizzle
- **Context:** Prisma is dormant (WASM edge issues) but Drizzle is active
- **Decision:** Maintain both drivers at parity until Prisma resolves edge runtime issues
- **Rules:**
  - Never delete or disable Prisma from `@commercejs/platform`
  - Always add Prisma equivalents when adding new Drizzle queries
  - Run `bash packages/platform/scripts/check-query-parity.sh` after query changes
  - Build script ships both drivers in dist (no `rm -rf dist/database/prisma`)

## 2026-02-20: Keep Drizzle + Neon HTTP on edge — don't extract a separate DB service
- **Context:** Analyzed extracting DB to a Node.js service to avoid edge constraints
- **Decision:** Current setup (Drizzle + `neon-http` on Cloudflare Pages) works well. No separate service needed.
- **Revisit if:** You need multi-statement transactions, a different DB backend, or hit real edge constraints

## 2026-02-20: Migrations run during Cloudflare build, not at runtime
- **Context:** `migrateDrizzle()` ran 25 CREATE TABLE statements on every cold start (~500-1000ms wasted)
- **Decision:** Extracted to `scripts/migrate.mjs` — runs during Cloudflare Pages build (before `nuxt build`) where DATABASE_URL is available
- **Rules:**
  - Never call `migrateDrizzle()` from server plugins or request handlers
  - Storefront build command: `pnpm --filter @commercejs/platform db:migrate && nuxt build`
  - Tests can still call `migrateDrizzle()` directly in their setup
  - Env vars stay on Cloudflare, not duplicated to GitHub secrets

## 2026-02-22: Cloud Identity naming — `Profile`
- **Context:** Needed a name for the cross-merchant buyer identity system (type, DB table, API path, SDK package)
- **Decision:**
  - Type: `Profile` (not `CustomerProfile` — avoids collision with existing `Customer` type)
  - DB tables: `profiles`, `profile_addresses`, `profile_payment_methods`, `profile_merchant_links`
  - API path: `/api/profile/*`
  - Events: `profile.recognized`, `profile.verified`, `profile.created`, etc.
  - SDK package: `@commercejs/profile` (thin HTTP client for self-hosted stores)
  - `@commercejs/connect` **reserved** for future broader "connect to all Cloud services" package
- **Rationale:** "Profile" matches the data it manages, is short, and doesn't conflict with anything. "Connect" is too broad for a package that only handles identity.

## 2026-02-23: Delivery dispatch model — separate admin action + optional autoDispatch
- **Context:** Needed to decide whether deliveries auto-dispatch on order creation or require explicit admin action
- **Decision:** Delivery dispatch is a **separate admin action** via `POST /api/delivery-dispatch`
  - Optional `autoDispatch: true` in `CommerceConfig` for automated dispatch on `order.created`
  - Default: manual dispatch (merchant decides timing, e.g., after food prep)
- **Rationale:** Most merchants need control over dispatch timing (e.g., restaurants prepare food first). Auto-dispatch is opt-in for simpler workflows.

## 2026-02-26: Armada integration — single-tenant now, multi-tenant later
- **Context:** Commerce.js Cloud registers one Armada app (App ID + App Secret). Each merchant who installs gets their own `access_token` via OAuth callback. Token never expires unless merchant uninstalls.
- **Decision:** Current implementation stores a single `armada:config` in Nitro storage — sufficient for testing with one store.
- **Multi-tenant plan:** When going multi-tenant, key the config per Commerce.js store:
  - Storage key: `armada:config:{commercejs_store_id}` instead of `armada:config`
  - Callback endpoint receives merchant info — map Armada `merchant.id` to a Commerce.js store ID
  - Install flow should include Commerce.js store context (e.g., query param or session state)
  - Each store's delivery provider reads its own token from storage
- **Revisit when:** Multiple stores are active on Commerce.js Cloud and need independent Armada integrations

## 2026-02-26: Storefront delivery — composable architecture, not standalone
- **Context:** Hosted checkout has standalone Armada API calls. Storefront needs the same delivery UX.
- **Decision:** Storefront uses the existing Commerce.js composable architecture (`useCheckout` → adapter → `ShippingMethod`). Delivery coordinates are passed as `metadata.lat`/`metadata.lng` in the shipping address, not a separate API call.
- **Rationale:** The `ShippingMethod` type already supports `fulfillmentType: 'local_delivery'` and `estimatedMinutes`. The checkout page already renders delivery estimates. Reusing the adapter pattern keeps everything consistent.

## 2026-02-26: Cart composable auto-creates and auto-recovers
- **Context:** `addItem()` threw if no cart ID existed. Stale cookies caused 500s.
- **Decision:** `useCart.addItem()` now auto-creates a cart if none exists, and retries once if the stored cart ID is stale (500/404). `refresh()` clears stale cookies instead of setting an error state.
- **Rationale:** Users should never see "No cart ID" errors. Cookie-persisted state can become stale after DB migrations — the composable must be resilient.
