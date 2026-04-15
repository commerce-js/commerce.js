# Checkpoint

## Current Phase

**Fly.io EaaS Migration — Step 7 (Dashboard UI Refactor) Complete**

The dashboard is now a pure cloud-operator console — auth via
email/password against `dashboard_users`, a merchants list/detail/create
flow that drives the Step 6 provisioning pipeline, and everything CF-
or merchant-admin-specific is gone. Bundle shrank from 17.9 MB → 14.4 MB.
Ready for Step 8 (`fly deploy` to Bahrain) on user confirmation.

⚠️ **Region note:** the Neon control project (Step 2) is in `us-east-1`
rather than the plan's recommended `aws-eu-central-1`. ~150 ms RTT from
Fly `bah`. Revisit if tenant-resolution latency in Step 4 hurts.

## Strategic Context

- **Goal**: EaaS platform (merchant signs up → gets storefront + admin + API + dedicated DB) AND open-source SDK recognition (like Medusa)
- **Why Fly.io**: CF Workers hit hard limits — 50 subrequest cap, WASM-only Prisma, no standard Node.js. Fly.io = standard Node.js, no constraints.
- **OSS story**: Depends on the platform running on plain Node.js first. Ship Fly.io EaaS → then open-source story becomes credible.
- **Market**: MENA-first (Bahrain region, Arabic RTL, Tap/stcpay/Mada/Tabby/Tamara). No Western competitor owns this stack.

## Current Codebase State (fly/eaas branch)

| Item | State |
|------|-------|
| `fly/eaas` branch | ✅ Created (Phase 1, commit `be0f63e`) |
| Prisma 7.6.0 + adapter-neon on platform | ✅ (Phase 0) |
| `apps/dashboard` Nitro preset | ✅ `node-server` |
| Dockerfile + fly.toml | ✅ |
| Dashboard NuxtHub / wrangler / Drizzle / @commercejs/cloud | ✅ Removed |
| `apps/dashboard/prisma/schema.prisma` | ✅ 4 models — Merchant, ApiKey, Domain, DashboardUser |
| `apps/dashboard/prisma.config.ts` | ✅ Wired to `CONTROL_DATABASE_URL` |
| `apps/dashboard/server/generated/prisma/` | ✅ Generated (gitignored) |
| `apps/dashboard/server/utils/db.ts` | ✅ Real PrismaClient singleton via PrismaNeon adapter |
| `/api/merchants/*` routes (Prisma) | ✅ index, [id], [id]/domains |
| `/api/projects/*` routes | ✅ Deleted |
| Deploy queue / consumer / DLQ / provisioner | ✅ Deleted |
| GitHub OAuth + webhook routes | ✅ Deleted |
| D1 Drizzle schema + migrations dir | ✅ Deleted |
| Neon `cjs-control` project | ✅ Live (`ep-patient-cake-a486kr45-pooler.us-east-1.aws.neon.tech`); URL in monorepo `.secrets` as `NEON_CONTROL_DB_URL` |
| `prisma migrate dev --name init` (control DB) | ✅ Applied — `20260414090613_init` (commit `c566e50`) |
| Platform active ORM | ✅ Prisma (+ `@prisma/adapter-neon`); barrel swap in `src/database/index.ts` (commit `c4c649d`) |
| Prisma Profile models | ✅ Added in `profile.prisma` (Profile, ProfileAddress, ProfilePaymentMethod, ProfileMerchantLink, ProfileOtpCode) |
| Prisma OTP queries | ✅ createOtpCode, findActiveOtpCode, markOtpVerified, incrementOtpAttempts, deleteExpiredOtpCodes |
| `check-query-parity.sh` | ✅ In sync — 148 exports on both drivers |
| Platform AsyncLocalStorage scoping | ✅ `bindDb(client)` / `runWithDb(client, fn)` in `prisma/client.ts`; `getDb()` prefers ALS over module singleton |
| Tenant resolver (`server/utils/tenant.ts`) | ✅ X-Commerce-Key → custom domain → subdomain precedence; LRU cache (1000/60 s); API-key sha256 verify |
| Tenant middleware (`server/middleware/tenant.ts`) | ✅ Skip list for control-DB/auth/health; 404/503/403 on resolve failure; cached PlatformAdapter per merchant |
| Plan-limits middleware | ✅ Trial expiry → 402; PLAN_LIMITS map for products/staff/customDomains; product-cap plumbing stubbed for Step 7 |
| h3 context augmentation | ✅ `event.context.merchant / adapter / admin` typed |
| BullMQ queue producer | ✅ `server/utils/queue.ts` — typed `enqueueMerchantJob()` for 3 job types |
| BullMQ Redis helper | ✅ `server/utils/redis.ts` — resolves `REDIS_URL` → else builds `rediss://` from Upstash REST creds |
| Standalone worker bundle | ✅ `worker.ts` → `.output/worker.mjs` (esbuild, `--packages=external`, 27.9 KB) |
| `build:worker` pipeline | ✅ `nuxt build && pnpm build:worker` wired into `build` |
| Dockerfile (multi-process) | ✅ Generates both Prisma clients, builds web + worker, snapshots prod `node_modules` via `pnpm deploy` for worker externals |
| `fly.toml` worker process | ✅ Uncommented (`worker = "node .output/worker.mjs"`) |
| Neon API helper (`server/utils/neon.ts`) | ✅ `createMerchantProject` / `deleteMerchantProject` with 2 s-base retry for 423/429/5xx |
| `server/utils/merchant-provisioner.ts` | ✅ Orchestrator — idempotent (resumes from partial), `runWithDb(client, migratePrisma)` for schema apply, invalidates tenant cache on activate |
| `migratePrisma()` Profile tables | ✅ Added (profiles + addresses + payment_methods + merchant_links + otp_codes) and exported |
| `worker.ts` provision-store handler | ✅ Calls `provisionMerchant()`, logs projectId / branchId on success |
| `POST /api/merchants` auto-enqueue | ✅ Enqueues `provision-store` immediately after row create |
| `POST /api/merchants/:id/provision` | ✅ Manual retry endpoint — short-circuits if already active |
| Email/password auth | ✅ bcrypt-ts against `dashboard_users`; login + first-run register routes |
| `DashboardSession` + gating middleware | ✅ Cookie-sealed session, `auth: false` page meta to opt out |
| `/merchants` list page | ✅ Status badges, polls every 5 s while any row is `provisioning` |
| `/merchants/new` page | ✅ Auto-derived subdomain, async-provisioning explainer, POSTs to `/api/merchants` |
| `/merchants/:id` detail page | ✅ Overview, infrastructure (Neon IDs + masked URL), domains, retry button, danger-zone delete |
| Nav + brand mark | ✅ Merchants / Settings / Profile only; CF + store/* tree removed |
| Pruned surface | ✅ `projects/*`, `deployments`, `usage`, `uptime`, `store/*`, `billing/*`, `/api/admin/*`, `/api/armada/*`, `useDeployStream`, `useAdminClient`, `useFormatCurrency`, `ProjectSwitcher` all deleted |

## What Was Done This Session (2026-04-14)

**Phase 1 (commit `be0f63e`):**
- Branched `fly/eaas`, swapped dashboard Nitro preset to `node-server`,
  dropped @nuxthub/core + hub config, swapped runtimeConfig keys
- Stubbed `db.ts` (re-exports legacy schema so old routes still compiled)
- Added Dockerfile + fly.toml

**Step 2 (this commit, code-complete):**
- Added Prisma deps to `apps/dashboard/package.json`
  (`@prisma/client`, `@prisma/adapter-neon`, dev `prisma`); removed
  `drizzle-orm`, `tweetnacl`, `tweetnacl-sealedbox-js`
- Created `apps/dashboard/prisma/schema.prisma` with the 4 control-DB
  models per the migration plan; generator uses `runtime = "nodejs"`
  (matched against `packages/platform`), output to
  `../server/generated/prisma`
- Created `apps/dashboard/prisma.config.ts` reading `CONTROL_DATABASE_URL`
  via `dotenv/config` (mirrors platform's prisma.config pattern — Prisma 7
  requires the URL out of the schema file)
- Generated client: `npx prisma generate` succeeds (with placeholder URL)
- Rewrote `apps/dashboard/server/utils/db.ts` from the Phase 1 stub into a
  real lazy-singleton PrismaClient backed by `PrismaNeon`. Build-time
  imports are safe; first call to `useDB()` reads the env var
- Created `/api/merchants/index.ts`, `/api/merchants/[id]/index.ts`,
  `/api/merchants/[id]/domains.ts` against the new schema
- Deleted CF-only / D1-only files:
  - `server/api/projects/*` (entire tree)
  - `server/api/auth/github*` (GH OAuth gone — moving to email/password)
  - `server/api/github/*`, `server/api/github-webhook.post.ts`
  - `server/utils/deploy-{provisioner,queue}.ts`,
    `server/utils/gh-actions-deploy.yml`
  - `server/plugins/deploy-{consumer,dlq}.ts`
  - `server/database/` (Drizzle schema + 5 D1 migration SQL files)
  - `server/types/tweetnacl-sealedbox-js.d.ts`
  - `apps/dashboard/wrangler.jsonc`
- Verified: `pnpm --filter dashboard build` succeeds; emits
  `merchants/_id/domains.mjs` and `merchants/index.mjs`. Bundle grew from
  7.98 MB → 12.6 MB (Prisma client overhead, expected on Fly.io).

## Known Carry-Over for Later Steps

- **Auth rewrite** — `server/utils/session.ts` still has `githubToken` /
  `githubUsername` fields on the session interface; `auth/session.get.ts`
  still surfaces them. Email/password auth comes in Step 7 (Dashboard UI
  Refactor) along with the `DashboardUser` table. Not blocking.
- **Dashboard UI** — `app/pages/projects/*.vue`, `composables/useDeployStream.ts`,
  `app/pages/deployments.vue`, `components/UserMenu.vue` still call
  `/api/projects/*` and reference the old session shape. These compile
  (no SSR dependence) but functionally broken until Step 7.
- **Armada routes** (`server/api/armada/*`) untouched. They use h3
  `useStorage('data')` (Nitro storage) — neutral on Fly.io. Will be
  reconsidered in Step 7 when the dashboard UI is rebuilt around
  merchant-management instead of integration-studio installs.
- **Domains route does no Fly cert provisioning yet** — it only manages
  control-DB rows. Cert/DNS automation lands with the merchant-provisioner
  in Step 6 (`fly_certificates` API).

## What Was Done This Session (2026-04-14, continued)

**Step 3 (commit `c4c649d`):**
- Added `packages/platform/src/database/prisma/schema/profile.prisma`
  with 5 models to match the Drizzle Profile family that had been
  missing from the Prisma schema entirely. Regenerated Prisma client.
- Extended `prisma/client.ts` with a single-tenant `getDb()`/
  `initPrisma()` pair (mirrors Drizzle's contract) while keeping the
  per-merchant `clientCache` / `getPrismaClient(url)` API that Step 4
  will use via the tenant middleware.
- Added OTP queries to `prisma/queries/profiles.ts`
  (`createOtpCode`, `findActiveOtpCode` with expiresAt-gt-now filter,
  `markOtpVerified`, `incrementOtpAttempts` using Prisma's atomic
  `{ increment: 1 }`, `deleteExpiredOtpCodes` via `deleteMany` + OR).
- Flipped `src/database/index.ts` — Prisma lines active, Drizzle
  commented (single swap point). Updated `src/adapter.ts` to
  dynamic-import `initPrisma`. Updated `src/index.ts` re-exports.
- Tightened `tsconfig.json` — excluded only `generated/**` (was
  `prisma/**`); surfaced 9 pre-existing implicit-any sites in
  `src/admin/*.ts`, `src/domains/cart.ts`, `src/domains/catalog.ts`
  and annotated each minimally.
- `check-query-parity.sh` green. Platform typecheck + build clean.

## Step 4 deliverables (commit `9e67402`)

- Added `AsyncLocalStorage`-backed tenant scoping to
  `packages/platform/src/database/prisma/client.ts`
  (`bindDb(client)` via `enterWith` for Nitro middleware; `runWithDb`
  wrapper for callback-scoped work like BullMQ jobs in Step 5). `getDb()`
  resolves ALS → module singleton → throw, so the existing domain query
  layer gets multi-tenancy without touching its call sites.
- `apps/dashboard/server/utils/tenant.ts` — resolver + LRU cache +
  `MerchantContext` type. API-key resolution verifies sha256(fullKey)
  against `keyHash` after a prefix lookup; fire-and-forget `lastUsed`
  bump.
- `apps/dashboard/server/middleware/tenant.ts` — skip list for
  control-DB + auth + health paths; 404/503/403 on failed resolution;
  `getPrismaClient(merchant.databaseUrl) → bindDb → ensureAdapter`.
  PlatformAdapter cache keyed on `databaseUrl` so URL rotations rebuild.
- `apps/dashboard/server/middleware/plan-limits.ts` — trial expiry check
  (402 once past `trialEndsAt` for plan='trial'); PLAN_LIMITS map +
  write-method gate with a product-count placeholder that Step 7 wires
  to `event.context.admin.catalog.countProducts`.
- `apps/dashboard/server/types/h3-context.d.ts` — module-augments h3's
  `H3EventContext` with `merchant`, `adapter`, `admin`.
- Deps: added `@commercejs/platform` + `@commercejs/types` (workspace)
  and `lru-cache@^11.2.5` to the dashboard.

## Known carry-over (pre-existing, unrelated to Step 4)

- `pnpm --filter dashboard typecheck` fails with "Cannot find module 'h3'"
  and missing Nitro auto-imports (`useRuntimeConfig`, `useSession`,
  `defineEventHandler`, etc). Reproduced on the pre-Step-4 tree — this is
  an h3 type-resolution problem in the pnpm workspace that predates the
  Fly.io migration. Runtime build path is fine. Revisit during Step 7 UI
  refactor if it blocks dev ergonomics.

## Step 5 deliverables (commit `d51fe4d`)

- `server/utils/redis.ts` — connection resolver + `createRedisConnection()`
  with BullMQ-required `maxRetriesPerRequest: null` + Upstash-friendly
  `lazyConnect: true`.
- `server/utils/queue.ts` — `MerchantJob` discriminated union
  (`provision-store | send-email | dispatch-webhook`), typed
  `enqueueMerchantJob()` overloads, Queue singleton with sensible retry
  (5 attempts, exponential backoff 5 s base) + cleanup defaults.
- `apps/dashboard/worker.ts` — standalone `Worker('merchant-jobs',
  dispatch, { concurrency: 5 })`. Dispatch switches on `job.name` with
  an exhaustiveness guard; handlers:
  - `handleProvisionStore` — idempotent stub (Step 6).
  - `handleSendEmail` — SMTP env-var check; transport deferred to Step 7.
  - `handleDispatchWebhook` — live. Resolves merchant DB URL, binds via
    `runWithDb`, POSTs payload with sha256 HMAC when the webhook row has
    a secret.
  - Graceful SIGINT/SIGTERM handling.
- `Dockerfile` — now runs both `prisma generate` calls, builds web +
  worker in one `pnpm --filter dashboard build`, and snapshots a
  production `node_modules` tree into `/tmp/worker-deploy` which gets
  copied into the runtime stage (worker bundle resolves externals from
  it).
- `fly.toml` — `worker = "node .output/worker.mjs"` process
  uncommented.
- package.json — `build` is now `nuxt build && pnpm build:worker`;
  `build:worker` runs esbuild with `--packages=external` → 27.9 KB output.

## Known carry-over (from Steps 1–5)

- `pnpm --filter dashboard typecheck` fails due to pre-existing Nitro
  auto-import resolution issues in the pnpm workspace (documented after
  Step 4). Runtime build path is fine.
- `handleSendEmail` is a stub — real SMTP transport ships in Step 7 with
  the dashboard UI.
- `handleProvisionStore` is a stub — real Neon branch/migration pipeline
  ships in Step 6.
- Legacy UI (`app/pages/projects/*.vue`, etc.) still calls `/api/projects/*`
  — Step 7 dashboard refactor.

## Step 6 deliverables (commit `657f53b`)

- `packages/platform/src/database/prisma/migrate.ts` — added Profile
  family (5 tables) so freshly-provisioned merchant DBs have buyer-
  identity tables; exported `migratePrisma` from the package barrel and
  `src/index.ts`.
- `server/utils/neon.ts` — Neon Control API wrapper, retry-with-backoff
  on 423/429/5xx (2 s base, 5 attempts). One project per merchant;
  region defaults to `aws-eu-central-1`.
- `server/utils/merchant-provisioner.ts` — orchestrator with idempotency
  (re-uses `merchant.neonProjectId` from a partial previous attempt),
  calls `runWithDb(getPrismaClient(newUrl), migratePrisma)` to apply the
  schema through the ALS binding, flips `status='active'` and invalidates
  the tenant resolver cache. Exports `PermanentError` for fail-fast on
  bad input.
- `worker.ts` handleProvisionStore → `provisionMerchant()`. Logs
  `projectId/branchId` on success; BullMQ retries on transient throws.
- `POST /api/merchants` now calls `enqueueMerchantJob` with
  `provision-store` right after the row insert.
- `POST /api/merchants/:id/provision` — manual retry route
  (short-circuits if already active).

## Known carry-over

- Live end-to-end Neon provisioning has NOT been exercised yet; will
  create a real Neon project + run the full pipeline on first QA use.
- `handleSendEmail` still a stub — real SMTP transport ships in Step 7.
- Legacy UI (`app/pages/projects/*.vue`) still references `/api/projects/*`
  — Step 7 dashboard refactor.
- `pnpm --filter dashboard typecheck` still pre-existing-broken (h3
  auto-import resolution); build path is clean.

## Step 7 deliverables (commits `14a77b4`, `a9fedb7`, `efd7d4b`)

- **7a — auth rewrite:** bcrypt-ts email/password login; first-run
  register route (self-closes when `dashboard_users` is non-empty);
  new session shape; cookie renamed to `cjs-dashboard-session`; login
  page dynamically switches between sign-in / first-run register UX.
- **7b — merchants UI:** list / new / detail pages wired to Step 2 + 6
  control-DB routes; polling on provisioning rows; masked databaseUrl;
  retry-provision button; danger-zone delete. Layout reduced to
  Merchants + Settings + Profile; brand mark replaces ProjectSwitcher.
- **7c — prune:** 33-file sweep: deleted `projects/*`, `deployments`,
  `usage`, `uptime`, the `store/*` merchant-admin subtree, `billing/*`,
  `/api/admin/*`, `/api/armada/*`, 3 orphan composables, 1 component.
  `settings.vue` + `profile.vue` simplified to read-only status cards.

## Known carry-over (from Step 7, deferred deliberately)

- **Role-based sidebar (owner vs support)** — `DashboardUser.role` is
  in the schema and carried in the session, but the two-role UX doesn't
  pay for itself yet. Add when there's an actual support team.
- **Live plan-limits `products` count** — middleware plumbing is in
  place (Step 4); the live count query is commented out, waiting for
  a stable admin catalog surface. Unblock as part of Step 8+ post-deploy
  work.
- **Billing / Stripe** — deferred to its own phase; removed from the
  dashboard entirely for now.
- **Password change / 2FA / admin-invite flow** — documented in the
  profile page as later-phase; a `POST /api/admin/users` invite route
  pairs with it.

## Immediate Next Steps

### Step 8 — Deploy to Fly.io (Day 13)

Per `.plans/fly-migration-plan.md` → Step 8:
1. `fly launch --no-deploy --copy-config` to register `commercejs-cloud`
   in Fly, skipping auto-generated fly.toml.
2. `fly secrets set` for each var in the monorepo-root `.secrets` file:
   `NEON_CONTROL_DB_URL`, `NEON_API_KEY`,
   `UPSTASH_REDIS_REST_URL`/`_TOKEN`, `SMTP_*`, `NUXT_SESSION_PASSWORD`,
   `STRIPE_*`, `SENTRY_DSN`.
3. `fly deploy --config fly.toml` — builds the image from the repo
   Dockerfile and boots both `web` and `worker` processes.
4. First smoke test:
   - `fly ssh console` into web → confirm `/api/_health` responds
   - `curl -X POST` a merchant creation → watch worker logs for the
     Neon-project-create + migratePrisma + status=active chain.
5. DNS: CNAME `commercejs.cloud` to the Fly app edge.

**Autonomous rule: `fly deploy` requires explicit user confirmation.**
Present a deployment checklist before running any `fly` commands.

## Key Files to Know

| File | Purpose |
|------|---------|
| `.plans/fly-migration-plan.md` | LOCKED DOWN — full step-by-step migration |
| `apps/dashboard/prisma/schema.prisma` | ✅ Control DB schema |
| `apps/dashboard/prisma.config.ts` | ✅ Reads `CONTROL_DATABASE_URL` |
| `apps/dashboard/server/utils/db.ts` | ✅ PrismaClient singleton |
| `apps/dashboard/server/api/merchants/` | ✅ New API surface |
| `packages/platform/src/adapter.ts` | ❌ Step 3 — switch initDatabase → initPrisma |
| `apps/dashboard/server/utils/tenant.ts` | ❌ Step 4 — tenant resolver |
| `apps/dashboard/worker.ts` | ❌ Step 5 — BullMQ worker |
| `apps/dashboard/server/utils/merchant-provisioner.ts` | ❌ Step 6 |
