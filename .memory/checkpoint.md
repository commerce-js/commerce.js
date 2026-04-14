# Checkpoint

## Current Phase

**Fly.io EaaS Migration — Step 2 (Control DB) Code Complete**

The dashboard now compiles against a Prisma/Neon control DB. Schema is
written, client is generated, route surface is migrated from `projects/*`
to `merchants/*`. **Migration has not been run yet** — Neon project + first
`prisma migrate dev` are user-pause checkpoints (see "Immediate Next Steps").

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
| Neon `cjs-control` project | ❌ **User-pause** — needs Neon console |
| `prisma migrate dev --name init` (control DB) | ❌ **User-pause** — autonomous rule blocks this |
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

## Immediate Next Steps

### Pause checkpoint — needs user input

1. **Create Neon project `cjs-control`** (Neon console or
   `neonctl projects create cjs-control --region-id aws-eu-central-1`).
   Capture the connection string into `apps/dashboard/.env`:
   ```
   CONTROL_DATABASE_URL="postgresql://..."
   ```
2. **Run the first migration** (autonomous rule blocks this — confirm with
   user before executing):
   ```bash
   cd apps/dashboard && npx prisma migrate dev --name init
   ```
   This creates the `migrations/` directory and applies the schema.

### Then: Step 3 — Prisma as Primary on Platform (Day 4)

Per `.plans/fly-migration-plan.md` → Step 3:
- `packages/platform/src/database/prisma/schema/schema.prisma` already has
  `runtime = "nodejs"` (Phase 0 work).
- Adjust `packages/platform/src/adapter.ts` so `initDatabase()` calls
  `initPrisma()` instead of `initDrizzle()`.
- Run `check-query-parity.sh` first to make sure each domain has a Prisma
  implementation matching the Drizzle one.

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
