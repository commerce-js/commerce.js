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

## 2026-02-26: Cloud Platform — CLI-First (Option A)
- **Context:** Needed to choose between CLI-First (bottom-up) or Dashboard-First (top-down) for making the Cloud Platform functional.
- **Decision:** CLI-First — make `commercejs deploy` work end-to-end before building dashboard UI.
- **Rationale:** Lower risk, faster time-to-first-deploy, validates core infrastructure without UI complexity. Dashboard frontend is built on top of proven backend.

## 2026-02-26: Cloud deploy uses wrangler CLI, not direct upload API
- **Context:** Cloudflare Pages supports both direct upload API and wrangler CLI for deployments.
- **Decision:** Use `npx wrangler pages deploy` subprocess via `execa`, not the raw multipart upload API.
- **Rationale:** wrangler handles asset hashing, deduplication, manifest generation, and retry logic. The raw API requires reimplementing all of this. wrangler is already a devDependency.

## 2026-02-26: Dashboard persistence uses D1 + Drizzle, not KV
- **Context:** Dashboard already had NuxtHub KV for Armada config. Cloud project data needs relational queries.
- **Decision:** Added D1 (SQLite) with Drizzle ORM for projects, deployments, and env vars. KV remains for simple key-value data (Armada config).
- **Rationale:** Projects have relational data (deployments → project, envVars → project) that doesn't fit KV. D1 is already enabled in NuxtHub config.

## 2026-02-26: Neon branch operations need retry-with-backoff
- **Context:** Neon returns 423 Locked for ~3s after project creation while endpoints initialize.
- **Decision:** `DeployOrchestrator` retries branch operations with exponential backoff (2s base, 5 retries).
- **Rationale:** This is a fundamental Neon API behavior — every path that provisions a project and then creates branches must include retry logic.

## 2026-02-26: Cloudflare Pages projects auto-set nodejs_compat
- **Context:** Nuxt 4 uses Node.js built-ins (`node:buffer`, `node:process`). First deploy failed with `No such module "node:buffer"`.
- **Decision:** `createPagesProject()` in `CloudflareProvider` sets `compatibility_flags: ['nodejs_compat']` and `compatibility_date: '2024-09-23'` on both production and preview configs at creation time.
- **Rationale:** This is always required for Nuxt/Nitro apps. Setting it at creation avoids a failed-first-deploy for every new project. The `--compatibility-flag` CLI option does NOT work with `wrangler pages deploy`.

## 2026-02-26: @commercejs/cloud must be rebuilt before CLI picks up changes
- **Context:** CLI imports `@commercejs/cloud` from built `dist/`, not source. Source edits had no effect until `pnpm --filter @commercejs/cloud build`.
- **Decision:** This is expected behavior for monorepo packages with `"main": "./dist/index.js"`. Always rebuild after source changes.
- **Workflow:** `pnpm --filter @commercejs/cloud build && npx tsx packages/cli/src/cli.ts deploy ...`

## 2026-02-27: Cloudflare Queues for async deploy provisioning
- **Context:** `deploy.post.ts` used a floating promise for background provisioning — errors were silently dropped, no retries, no visibility
- **Decision:** Use Cloudflare Queues (`cjs-deploy-queue`) with DLQ for deploy jobs. Dashboard Worker acts as both producer and consumer.
- **Config:** `max_batch_size: 1` (heavy ops), `max_retries: 3`, `retry_delay: 60s`
- **Patterns:**
  - Per-message try/catch (never retry entire batch on single failure)
  - Idempotency by deployment ID (skip if already `ready` or `failed`)
  - Error classification: retry transient (423/429/5xx), ack permanent (400/401/403/404)
  - Local dev fallback: inline provisioning when Queue binding is unavailable
- **Key files:** `wrangler.jsonc`, `server/utils/deploy-queue.ts`, `server/utils/deploy-provisioner.ts`, `server/plugins/deploy-consumer.ts`

## 2026-03-12: Fly.io EaaS branch — Prisma as primary ORM
- **Context:** Pivoting CommerceJS to EaaS on Fly.io. Cloudflare's restricted runtime (WASM, CPU limits, no WebSockets) blocked Prisma. Fly.io runs standard Node.js.
- **Decision:** On `fly/eaas` branch, Prisma is the primary ORM for both control DB and merchant DBs. Drizzle stays primary on `main` (CF).
- **Changes:** `schema.prisma` generator `runtime = "node"`, `adapter.ts` calls `initPrisma()`, control DB uses `PrismaClient`.
- **Rules:**
  - Run `check-query-parity.sh` before switching to ensure Prisma implementations are up-to-date
  - `fly/eaas` does NOT import from `packages/cloud/` — new provisioning is in `dashboard/server/utils/`
  - Keep `packages/platform/` changes backwards-compatible so cherry-picks to `main` don't break Drizzle

## 2026-03-12: Two-database architecture for EaaS
- **Context:** Multi-tenant EaaS needs cloud metadata separate from merchant commerce data.
- **Decision:** Two Prisma connections per request:
  1. **Control DB** (Neon project `cjs-control`): merchants, api_keys, domains, dashboard_users
  2. **Merchant DB** (Neon branch per merchant): products, orders, carts, customers (existing platform schema)
- **Connection strategy:** Control DB = singleton PrismaClient. Merchant DB = cached PrismaClient per merchant (Map with idle disconnect).

## 2026-03-12: Branch strategy for Fly.io migration
- **Context:** Need to develop Fly.io infrastructure without disrupting existing Cloudflare setup on `main`.
- **Decision:** `fly/eaas` branch diverges from `main`. Cherry-pick shared business logic weekly. If Fly.io validates, `fly/eaas` becomes `main`.
- **Plan:** See `.plans/fly-migration-plan.md` for locked-down details.

## 2026-03-12: BullMQ replaces Cloudflare Queues on fly/eaas
- **Context:** CF Queues use `nitro._queue` hook (CF-only). Fly.io needs a portable job queue.
- **Decision:** BullMQ + Upstash Redis. Standalone `worker.ts` entry point as a separate Fly process.
- **Job types:** `provision-store`, `send-email`, `dispatch-webhook`
- **Built-in:** 3 retries with exponential backoff, failed job visibility (replaces DLQ plugin)

## 2026-07-03: Session seal is fail-closed in production
- **Context:** The dashboard's three sealed cookies (operator, merchant staff, buyer) each fell back to a hardcoded 32-char key (`dev-only-session-key-32-chars-min!`) when `NUXT_SESSION_PASSWORD` was missing/short — and that fallback fired in production, making every session cookie forgeable.
- **Decision:** One shared policy in `apps/dashboard/server/utils/sessionSeal.ts`. `pickSessionPassword(secret, isDev)` returns a strong secret if present, falls back to the dev key ONLY when `import.meta.dev`, and otherwise **throws**. A Nitro plugin (`server/plugins/00-validate-session-seal.ts`) re-checks at startup so a misconfigured prod deploy **refuses to boot** (verified: `node .output/server/index.mjs` exits 1 with no secret). `/api/_health` exposes `sessionSealSecure`.
- **Rules:**
  - Never reintroduce a production-reachable hardcoded seal fallback.
  - All three session utils go through `resolveSessionPassword()` — don't inline the check per file (it drifted before).
  - Production MUST set `NUXT_SESSION_PASSWORD` to ≥32 random chars, or the app will not start.

## 2026-07-04: Control-plane routes require an authenticated operator
- **Context:** Every `/api/merchants/*` route (list/create/update/delete merchant, provision, domains) ran with **no auth check** — anyone reaching `app.commercejs.cloud` could enumerate tenants or create merchants (which triggers billable Neon provisioning). `GET /api/merchants/:id` also returned `api_keys.keyHash`.
- **Decision:** Gate all control-plane routes with `requireDashboardSession(event, access)` (util `authorize.ts`). Reads require any authenticated operator (`read`); mutations require `role === 'admin'` (`admin`). `support` is read-only. The policy is a pure `authorizeDashboardSession()` (unit-tested); the guard runs before any control-DB access so unauthenticated calls 401 cleanly.
- **Rules:**
  - New `/api/merchants/*` (and any control-DB) route MUST call `requireDashboardSession` first.
  - Never return `api_keys.keyHash` to the client — use `PUBLIC_API_KEY_SELECT`.
  - API keys: format + hashing live in `utils/apiKey.ts`, shared by the mint route and the tenant resolver so they can't drift. Only the SHA-256 is stored; plaintext is shown once at mint.
  - SSR pages fetching gated routes must forward the cookie (`useRequestHeaders(['cookie'])` on the server) — in-process SSR fetches don't inherit request headers.
