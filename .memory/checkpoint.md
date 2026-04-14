# Checkpoint

## Current Phase

**Fly.io EaaS Migration — Step 3 (Platform → Prisma) Complete**

`packages/platform` now ships Prisma as its active ORM. The control DB
(Step 2) and the platform (Step 3) both run on Prisma + Neon adapter.
Drizzle stays in-tree for the `main` branch; a single barrel swap in
`src/database/index.ts` is the driver switch-point.

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
| Tenant middleware | ❌ Step 4 |
| BullMQ worker | ❌ Step 5 |
| Merchant provisioner | ❌ Step 6 |

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

## Immediate Next Steps

### Step 4 — Tenant Resolution (Day 5)

Per `.plans/fly-migration-plan.md` → Step 4:
- Create `apps/dashboard/server/utils/tenant.ts`:
  - `resolveMerchant(event)` — subdomain → `X-Commerce-Key` header →
    custom domain precedence
  - `getMerchantConfig(merchantId)` — Prisma lookup against control DB,
    LRU-cached (1000 entries, 60 s TTL)
- Wire the resolver into Nitro middleware so every storefront / admin
  API request has a resolved merchant before domain code runs.
- Tenant middleware returns the merchant's per-branch connection string;
  the platform's `getPrismaClient(connectionString)` takes it from there.

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
