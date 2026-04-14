# Fly.io Migration Plan — LOCKED DOWN

> Comprehensive plan for running CommerceJS EaaS on Fly.io.
> Evaluated against actual codebase on 2026-03-12. Every file analyzed.

---

## Decision Record

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Prisma is the primary ORM** on `fly/eaas` | Full Node.js — no WASM, no adapters, native binary engine. Drizzle stays on `main` for CF. |
| 2 | **No `@commercejs/tenant` package** | Tenant resolution is app-level code — lives in `apps/dashboard/server/utils/` |
| 3 | **Two databases**: control DB (Prisma on Neon) + merchant DBs (Prisma on Neon branches) | Control = cloud metadata. Merchant = commerce data (per-merchant isolation). |
| 4 | **Prisma schema `runtime = 'node'`** on this branch | Currently `runtime = 'cloudflare'` — change in `schema.prisma` generator block |
| 5 | **BullMQ + Upstash Redis** for background jobs | Replaces CF Queues (`nitro._queue` hook which is CF-only) |
| 6 | **Keep `packages/cloud/` untouched** | Still used by `main`. New provisioning logic in `dashboard/server/utils/merchant-provisioner.ts` |
| 7 | **Dashboard control DB: Prisma on Postgres** (not Drizzle on SQLite/D1) | Currently `drizzle-orm/sqlite-core` with D1. Rewrite schema as Prisma Postgres. |
| 8 | **Fly.io region: `bah` (Bahrain)** | Closest to GCC market, ~$2/mo for shared-cpu, auto-suspend |

---

## Branch Strategy

```
main (Cloudflare)          ← untouched
  └── fly/eaas             ← all Fly.io + multi-tenant + Prisma work
```

- `main` stays as-is — CF Pages, D1, Drizzle, wrangler
- `fly/eaas` diverges: Fly.io, Prisma, Neon Postgres, BullMQ
- Cherry-pick shared fixes between branches weekly
- If Fly.io validates, `fly/eaas` becomes `main`

---

## Two-Database Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Fly.io Machine                        │
│                                                         │
│  ┌─────────────────┐    ┌────────────────────────────┐ │
│  │ Tenant Middleware │───▶│ Control DB (Prisma)        │ │
│  │ resolve merchant │    │ merchants, api_keys, users  │ │
│  └─────────────────┘    │ Neon project: cjs-control    │ │
│         │                └────────────────────────────┘ │
│         │ merchant.database_url                         │
│         ▼                                               │
│  ┌──────────────────┐   ┌────────────────────────────┐ │
│  │ PlatformAdapter   │──▶│ Merchant DB (Prisma)       │ │
│  │ per-request scope │   │ products, orders, carts... │ │
│  └──────────────────┘   │ Neon branch: merchant-xxx   │ │
│                          └────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Control DB (Neon project: `cjs-control`)

Holds cloud metadata — merchants, API keys, domains, billing. Managed by dashboard admin.

**New Prisma schema:** `apps/dashboard/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../server/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("CONTROL_DATABASE_URL")
}

model Merchant {
  id             String    @id @default(uuid())
  name           String
  email          String    @unique
  passwordHash   String?   @map("password_hash")
  subdomain      String    @unique
  plan           String    @default("trial")
  databaseUrl    String?   @map("database_url")
  neonProjectId  String?   @map("neon_project_id")
  neonBranchId   String?   @map("neon_branch_id")
  status         String    @default("provisioning")
  dashboardRole  String    @default("owner") @map("dashboard_role")
  provisionedBy  String?   @map("provisioned_by")
  stripeCustomer String?   @map("stripe_customer")
  currency       String    @default("SAR")
  locale         String    @default("ar-SA")
  customDomain   String?   @map("custom_domain")
  trialEndsAt    DateTime? @map("trial_ends_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  apiKeys  ApiKey[]
  domains  Domain[]

  @@map("merchants")
}

model ApiKey {
  id         String    @id @default(uuid())
  merchantId String    @map("merchant_id")
  keyHash    String    @map("key_hash")
  keyPrefix  String    @map("key_prefix")
  name       String
  lastUsed   DateTime? @map("last_used")
  createdAt  DateTime  @default(now()) @map("created_at")

  merchant Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)

  @@index([keyHash])
  @@map("api_keys")
}

model Domain {
  id         String   @id @default(uuid())
  merchantId String   @map("merchant_id")
  domain     String   @unique
  verified   Boolean  @default(false)
  sslStatus  String   @default("pending") @map("ssl_status")
  createdAt  DateTime @default(now()) @map("created_at")

  merchant Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)

  @@map("domains")
}

model DashboardUser {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  passwordHash  String   @map("password_hash")
  role          String   @default("admin") // 'admin' | 'support'
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("dashboard_users")
}
```

### Merchant DB (Neon branches, one per merchant)

Each merchant gets the existing `@commercejs/platform` schema — products, orders, carts, customers, etc. (14 Prisma model files already exist).

**Change in `schema.prisma` generator:**
```diff
 generator client {
-  runtime = "cloudflare"
+  runtime = "node"
 }
```

**Change in `adapter.ts`:**
```diff
 async function initDatabase(connectionString: string) {
-  const { initDrizzle } = await import('./database/drizzle/client.js')
-  initDrizzle(connectionString)
+  const { initPrisma } = await import('./database/prisma/client.js')
+  await initPrisma(connectionString)
 }
```

---

## File-by-File Change Matrix

### New Files

| File | Purpose | Lines (est.) |
|------|---------|-------------|
| `Dockerfile` | Multi-stage build: pnpm → build → slim Node.js runtime | ~25 |
| `fly.toml` | Fly app config: region, processes, auto-suspend, health | ~30 |
| `docker-compose.dev.yml` | Local dev: redis only | ~8 |
| `apps/dashboard/prisma/schema.prisma` | Control DB schema (Merchant, ApiKey, Domain, DashboardUser) | ~80 |
| `apps/dashboard/server/utils/tenant.ts` | `resolveMerchant()`, `getMerchantConfig()`, LRU cache | ~80 |
| `apps/dashboard/server/middleware/tenant.ts` | Per-request: resolve merchant → inject adapter + DB context | ~40 |
| `apps/dashboard/server/middleware/plan-limits.ts` | Plan enforcement (trial expiry, product limits, feature gates) | ~50 |
| `apps/dashboard/server/utils/merchant-provisioner.ts` | Neon DB provisioning only (extracted from deploy-provisioner) | ~100 |
| `apps/dashboard/worker.ts` | BullMQ worker: provision-store, send-email, webhooks | ~80 |
| `apps/dashboard/server/api/admin/merchants/*.ts` | CRUD routes for merchant management | ~200 |
| `apps/dashboard/server/api/_health.get.ts` | Health check endpoint for Fly | ~10 |

### Modified Files

| File | What Changes | Why |
|------|-------------|-----|
| `apps/dashboard/nuxt.config.ts` | `preset: 'node-server'`, remove `@nuxthub/core` module, remove `hub.*`, update `runtimeConfig` (remove CF keys, add control DB) | Fly runs Node |
| `apps/dashboard/server/utils/db.ts` | Rewrite: `PrismaClient` on Neon Postgres instead of `drizzle(d1)` via `hubDatabase()` | Control DB driver change |
| `apps/dashboard/server/utils/deploy-queue.ts` | BullMQ `queue.add()` instead of `event.context.cloudflare.env.DEPLOY_QUEUE.send()` | CF Queues → BullMQ |
| `packages/platform/src/adapter.ts` | `initDatabase()` calls `initPrisma()` instead of `initDrizzle()` | Prisma primary on Fly |
| `packages/platform/src/database/prisma/schema/schema.prisma` | `runtime = "node"` instead of `runtime = "cloudflare"` | Native binary engine |

### Deleted Files

| File | Why |
|------|-----|
| `apps/dashboard/server/plugins/deploy-consumer.ts` | CF Queue consumer (`nitro._queue` hook) — replaced by `worker.ts` |
| `apps/dashboard/server/plugins/deploy-dlq.ts` | CF DLQ handler — BullMQ has built-in failed job handling |
| `apps/dashboard/wrangler.jsonc` | Not used on Fly |

### Untouched (~85% of codebase)

| Component | Why Unchanged |
|-----------|--------------|
| `packages/cloud/` (entire package) | Stays for `main` branch CF deploys |
| `packages/platform/src/domains/*` | All 12 domain files are driver-agnostic (use `getDb()` abstraction) |
| `packages/platform/src/database/prisma/schema/*.prisma` (14 model files) | Already correct — only generator config changes |
| `packages/platform/src/database/drizzle/` | Stays for `main` branch and CF runtime |
| `packages/nuxt/` | Composables + server routes work identically on Node.js |
| `packages/types/`, `packages/core/`, `packages/checkout/` | No runtime dependency |
| All adapter packages (`adapter-salla`, `adapter-medusa`) | No change |
| All provider packages (payment-tap, delivery-*, notification-*, analytics-ga) | No change |
| `apps/storefront/`, `apps/docs/`, `apps/hosted-checkout/` | Separate deployments |

---

## Migration Steps (Locked Down)

### Step 1: Branch, Preset, Docker (Day 1)

**Actions:**
1. `git checkout -b fly/eaas`
2. Edit `apps/dashboard/nuxt.config.ts`:
   - Change `preset: 'node-server'`
   - Remove `@nuxthub/core` from modules
   - Remove entire `hub: { database, blob, kv }` block
   - Update `runtimeConfig`: remove `cloudflareApiToken`, `cloudflareAccountId`; add `controlDatabaseUrl`
3. Add `Dockerfile` (multi-stage: node:20-slim → pnpm install → nuxt build → copy `.output/`)
4. Add `fly.toml` (app name `commercejs-cloud`, region `bah`, port 3000, auto-suspend)
5. Stub `apps/dashboard/server/utils/db.ts` to prevent build failures (export a TODO)

**Verification:** `pnpm --filter dashboard build` completes with `node-server` preset.

**Pre-mortem:** Build will fail if any server file imports `hubDatabase()`, `hubKV()`, `hubBlob()`, or accesses `event.context.cloudflare`. Must stub/remove all NuxtHub usage first.

### Step 2: Control DB — D1 to Prisma/Neon (Days 2–3)

**Actions:**
1. Create Neon project `cjs-control` in `aws-eu-central-1` (via Neon console)
2. Create `apps/dashboard/prisma/schema.prisma` with `Merchant`, `ApiKey`, `Domain`, `DashboardUser` models
3. Run `npx prisma migrate dev --name init` against control Neon DB
4. Rewrite `apps/dashboard/server/utils/db.ts`:
   ```ts
   import { PrismaClient } from '../generated/prisma'
   const prisma = new PrismaClient({ datasources: { db: { url: process.env.CONTROL_DATABASE_URL } } })
   export { prisma }
   ```
5. Port existing API routes from D1 Drizzle queries to Prisma queries

**Migration mapping** (D1 SQLite → Postgres Prisma):

| D1 Table | New Prisma Model | Key Changes |
|----------|-----------------|-------------|
| `users` (GH OAuth) | `DashboardUser` (email/password) | No more GitHub-only auth — email/password for admin |
| `projects` | `Merchant` | Rename; drop `cfPagesProjectName`, `r2BucketName`, `kvNamespaceId`, `repoUrl`; add `plan`, `dashboardRole`, `currency`, `locale` |
| `deployments` | **Removed** | No per-merchant deployments — one shared Fly app |
| `envVars` | **Removed** | No per-merchant env vars — merchant config stored in `Merchant` model |
| `domains` | `Domain` | Drop `cfDomainId`; add `verified`, `sslStatus` |

**Verification:** Dashboard API routes work against Neon (create/read/update merchant).

### Step 3: Prisma as Primary on Platform (Day 4)

**Actions:**
1. In `packages/platform/src/database/prisma/schema/schema.prisma`:
   - Change `runtime = "cloudflare"` to `runtime = "node"`
2. Run `npx prisma generate` in `packages/platform/`
3. Create `packages/platform/src/database/prisma/client.ts`:
   ```ts
   import { PrismaClient } from './generated'
   let _prisma: PrismaClient | null = null
   
   export async function initPrisma(connectionString: string) {
     if (_prisma) return _prisma
     _prisma = new PrismaClient({ datasources: { db: { url: connectionString } } })
     await _prisma.$connect()
     return _prisma
   }
   
   export function getPrisma(): PrismaClient {
     if (!_prisma) throw new Error('Prisma not initialized')
     return _prisma
   }
   ```
4. In `packages/platform/src/adapter.ts`:
   - Change `initDatabase()` to call `initPrisma()` instead of `initDrizzle()`
5. Verify all 12 domain files work with Prisma client (they already have Prisma implementations maintained at parity)

**Verification:** `createPlatformAdapter({ connectionString })` works and domain CRUD operations succeed.

**Pre-mortem:** The Prisma query implementations in each domain file may have been lagging behind Drizzle. Run the `check-query-parity.sh` script first to identify gaps. Fix any missing Prisma queries before this step.

### Step 4: Tenant Resolution (Day 5)

**Actions:**
1. Create `apps/dashboard/server/utils/tenant.ts`:
   - `resolveMerchant(event)` → extract from subdomain, `X-Commerce-Key` header, or custom domain
   - `getMerchantConfig(merchantId)` → Prisma query on control DB, LRU-cached (1000 entries, 60s TTL)
   - Export `MerchantContext` type
2. Create `apps/dashboard/server/middleware/tenant.ts`:
   - Calls `resolveMerchant()` → `getMerchantConfig()`
   - Creates `PlatformAdapter` scoped to merchant's `database_url`
   - Sets `event.context.merchant` and `event.context.adapter`
   - Skip for admin routes (`/api/admin/*` use control DB directly)
3. Create `apps/dashboard/server/middleware/plan-limits.ts`:
   - Check trial expiry
   - Enforce product count limits per plan
   - Gate features by plan tier

**Question resolved:** Tenant middleware skips admin routes. Admin operates on control DB. Storefront routes use tenant-scoped adapter.

### Step 5: BullMQ Background Jobs (Day 6)

**Actions:**
1. `pnpm --filter dashboard add bullmq ioredis`
2. Rewrite `apps/dashboard/server/utils/deploy-queue.ts`:
   ```ts
   import { Queue } from 'bullmq'
   const merchantQueue = new Queue('merchant-jobs', { connection: redisConfig })
   export async function enqueueMerchantJob(type: string, data: any) {
     await merchantQueue.add(type, data, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })
   }
   ```
3. Create `apps/dashboard/worker.ts` (standalone entry point):
   ```ts
   import { Worker } from 'bullmq'
   const worker = new Worker('merchant-jobs', async (job) => {
     switch (job.name) {
       case 'provision-store': return handleProvisionStore(job.data)
       case 'send-email': return handleSendEmail(job.data)
       case 'dispatch-webhook': return handleWebhook(job.data)
     }
   }, { connection: redisConfig, concurrency: 5 })
   ```
4. Delete `apps/dashboard/server/plugins/deploy-consumer.ts`
5. Delete `apps/dashboard/server/plugins/deploy-dlq.ts`
6. Add `worker` process to `fly.toml` (multi-process)

**Verification:** Enqueue a test job → worker picks it up → logs output.

### Step 6: Merchant Provisioning (Days 7–8)

**Actions:**
1. Create `apps/dashboard/server/utils/merchant-provisioner.ts`:
   - **Extracted from `deploy-provisioner.ts`** — keeps only Neon provisioning:
     1. Call `NeonProvider.createBranch()` (or `.createProject()` for isolation)
     2. Run `prisma migrate deploy` against new branch connection string
     3. Seed initial store data (from template)
     4. Update control DB: `merchant.status = 'active'`, `merchant.databaseUrl = connectionUri`
   - **Removed:** CF Pages creation, wrangler deploy, GH Actions secrets, workflow dispatch
   - Keep `PermanentError`, `isRetryable()` utilities from original
2. Create admin API routes:
   - `POST /api/admin/merchants` — validate, create merchant record, enqueue `provision-store` job
   - `GET /api/admin/merchants` — list with pagination, plan filter
   - `GET /api/admin/merchants/:id` — detail view
   - `PATCH /api/admin/merchants/:id` — update settings
   - `DELETE /api/admin/merchants/:id` — soft delete (set `status = 'suspended'`)
3. Wire `provision-store` job handler to `merchant-provisioner.ts`

**Verification:** Create merchant via API → provisioning job runs → Neon branch created → migrations run → merchant status becomes `active`.

### Step 7: Dashboard UI Refactor — Agency Mode (Days 9–12)

**Actions:**
1. Replace "projects" terminology with "merchants" throughout UI
2. Merchant list page with status badges (provisioning, active, suspended)
3. Merchant detail page (settings, database info, plan, usage)
4. Remove CF-specific UI:
   - ❌ Pages project status
   - ❌ Wrangler deploy logs
   - ❌ GitHub repo linking
   - ❌ Environment variables CRUD (per-merchant)
5. Role-based sidebar:
   - `owner` sees: merchants list, create merchant, billing, settings
   - `client` sees: products, orders, customers, store settings only
6. Admin auth: email/password login (not GitHub OAuth)

### Step 8: Deploy to Fly.io (Day 13)

**Actions:**
```bash
# 1. Create app
fly launch --name commercejs-cloud --region bah --no-deploy

# 2. Set secrets
fly secrets set \
  CONTROL_DATABASE_URL="postgresql://..." \
  NEON_API_KEY="..." \
  UPSTASH_REDIS_URL="rediss://..." \
  NUXT_SESSION_PASSWORD="$(openssl rand -hex 32)"

# 3. Deploy
fly deploy

# 4. SSL certs for custom domains
fly certs add "*.cjs.store"
fly certs add "cjs.store"
```

**DNS (Cloudflare):**
```
*.cjs.store   CNAME   commercejs-cloud.fly.dev   (DNS only, no proxy)
cjs.store     CNAME   commercejs-cloud.fly.dev   (DNS only, no proxy)
```

**Verification:** Dashboard loads. Create a merchant. Merchant's subdomain resolves. Products API returns data.

### Step 9: Self-Service Layer (Days 14–20, After Agency Validation)

- Public signup page + email verification
- Template system (3 starter templates with seed data)
- Stripe Billing integration (subscriptions, trials, webhooks)
- Plan enforcement middleware (product limits, API rate limits)
- Landing page at `cjs.store`
- Trial expiry handling (14-day trial → suspend if no subscription)

---

## Fly.io Pricing Reference

### Compute

| Preset | vCPU | RAM | $/hr | $/mo (always-on) |
|--------|------|-----|------|-------------------|
| `shared-cpu-1x` | 1 shared | 256 MB | $0.0027 | ~$1.94 |
| `shared-cpu-1x` | 1 shared | 512 MB | $0.0041 | ~$2.92 |
| `shared-cpu-1x` | 1 shared | 1 GB | $0.0054 | ~$3.89 |
| `performance-1x` | 1 dedicated | 2 GB | $0.0275 | ~$19.80 |
| `performance-2x` | 2 dedicated | 4 GB | $0.055 | ~$39.60 |

**Auto-suspend:** Machines suspend when idle, wake on request (~200ms). Billed only while running.

### Networking

| Resource | Cost |
|----------|------|
| Shared IPv4 | Free |
| Dedicated IPv4 | $2/mo |
| Outbound (NA/EU) | $0.02/GB |
| Outbound (Asia) | $0.04/GB |
| Outbound (Africa/SA) | $0.12/GB |
| Inbound | Free |

### Relevant Regions

| Code | Location | Latency to GCC |
|------|----------|---------------|
| `bah` | Bahrain | ⭐ <10ms |
| `fra` | Frankfurt | ~80ms |
| `ams` | Amsterdam | ~90ms |

### Our Estimated Monthly Cost

| Scenario | Config | Cost |
|----------|--------|------|
| **MVP** | 1× shared-cpu-1x 256MB, auto-suspend | ~$2/mo |
| **Production** | 2× shared-cpu-1x 512MB, `bah` + `fra` | ~$6–8/mo |
| **100 merchants** | 4× shared-cpu-1x 1GB, 3 regions | ~$16–20/mo |

**+ Neon:** $0 (scale-to-zero branches) to $20/mo (active merchants)
**+ Upstash Redis:** $0–10/mo (serverless)
**Total MVP:** **~$2–5/mo**

---

## Resolved Questions

| Question | Answer |
|----------|--------|
| Do we need `@commercejs/tenant`? | **No.** Dashboard server utils only. |
| Prisma on Fly.io? | **Yes.** Native Node.js — no WASM, no adapters. Works perfectly. |
| What ORM on `fly/eaas`? | **Prisma.** Both control DB and merchant DBs. |
| What ORM stays on `main`? | **Drizzle** (Neon serverless HTTP for platform, D1 for dashboard). |
| Which files in `deploy-provisioner.ts` are reusable? | Neon API calls (Steps 2, partial Step 3). `PermanentError`, `isRetryable()`. Everything else is CF-specific and dropped. |
| Does tenant middleware run on admin routes? | **No.** Admin routes (`/api/admin/*`) use control DB directly. |
| How does `PlatformAdapter` get scoped per-merchant? | Tenant middleware creates a new adapter per request with the merchant's `database_url`. |
| What about the storefront app? | Separate concern — on `fly/eaas`, storefronts are rendered by the same Fly app via tenant-resolved routes. |
| What about R2 (media storage)? | Use Cloudflare R2 API directly (shared bucket with merchant-prefixed keys) or switch to S3-compatible (Tigris on Fly). Decide during Step 7. |
| What about GitHub OAuth for admin? | **Dropped.** Dashboard admin uses email/password auth. Simpler, no GitHub dependency. |
| Connection pooling for many merchants? | Neon's built-in pgBouncer pooler (append `-pooler` to hostname). Each merchant gets pooled connections. |
| How to handle multi-tenant Prisma? | Create `PrismaClient` per request with merchant's `database_url`. Use connection cache with TTL to avoid re-creating clients. |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Prisma query parity gaps (Drizzle ahead) | Medium | Run `check-query-parity.sh` before Step 3. Fix gaps first. |
| New `PrismaClient` per request = connection overhead | Medium | Connection cache (Map<merchantId, PrismaClient>) with idle disconnect after 5 min. Neon pooler handles pooling. |
| Nuxt build fails with leftover NuxtHub imports | High | Step 1 explicitly stubs all hub usage before building. |
| Branch diverges too far from `main` | High | Cherry-pick shared business logic weekly. Keep `packages/` changes minimal and backwards-compatible. |
| Fly Bahrain region availability | Low | Fallback to `fra`. Add second region in Step 8 for HA. |
| BullMQ worker crashes aren't visible | Medium | Health check endpoint on worker process. Fly auto-restarts on crash. Log to Fly logging. |
| Prisma multi-file schema breaking on generate | Low | Already working — 14 `.prisma` files exist and generate correctly. |

---

## nuxt.config.ts (Final State on fly/eaas)

```ts
export default defineNuxtConfig({
  compatibilityDate: '2026-02-16',
  future: { compatibilityVersion: 4 },

  modules: [
    '@nuxt/ui',
    // NO @nuxthub/core
  ],

  css: ['~/assets/css/main.css'],

  // NO hub config

  nitro: {
    preset: 'node-server',
  },

  devServer: { host: '0.0.0.0' },

  app: {
    head: {
      title: 'CommerceJS Cloud',
      meta: [
        { name: 'description', content: 'Ecommerce as a Service — deploy stores instantly' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@300..900&family=Geist+Mono:wght@300..900&display=swap' },
      ],
    },
  },

  runtimeConfig: {
    controlDatabaseUrl: '',
    neonApiKey: '',
    sessionPassword: '',
    redisUrl: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    public: {
      appTitle: 'CommerceJS Cloud',
      baseUrl: 'http://localhost:3002',
    },
  },
})
```

---

## Dockerfile (Final)

```dockerfile
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/ packages/
COPY apps/dashboard/ apps/dashboard/
RUN pnpm install --frozen-lockfile
# Generate Prisma clients (platform + control DB)
RUN cd packages/platform && npx prisma generate
RUN cd apps/dashboard && npx prisma generate
RUN pnpm --filter dashboard build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/apps/dashboard/.output .output/
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

---

## fly.toml (Final)

```toml
app = "commercejs-cloud"
primary_region = "bah"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"

[processes]
  web = "node .output/server/index.mjs"
  worker = "node .output/worker.mjs"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "suspend"
  auto_start_machines = true
  min_machines_running = 1
  processes = ["web"]

  [http_service.concurrency]
    type = "requests"
    hard_limit = 250
    soft_limit = 200

  [[http_service.checks]]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    path = "/api/_health"
    timeout = "5s"
```

---

## Estimated Timeline

| Step | Days | Dependencies | Parallelizable With |
|------|------|-------------|-------------------|
| 1. Branch + Preset + Docker | 1 | — | — |
| 2. Control DB (Prisma/Neon) | 2 | Step 1 | — |
| 3. Prisma primary on platform | 1 | Step 1 | Step 2 |
| 4. Tenant resolution | 1 | Steps 2, 3 | — |
| 5. BullMQ jobs | 1 | Step 1 | Steps 2, 3 |
| 6. Merchant provisioning | 2 | Steps 2, 4, 5 | — |
| 7. Dashboard UI refactor | 4 | Steps 4, 6 | — |
| 8. Deploy to Fly.io | 1 | Steps 1–7 | — |
| 9. Self-service layer | 5–7 | Step 8 | — |
| **Agency MVP total** | **~13 days** | | |
| **Full EaaS total** | **~20 days** | | |

> Steps 2, 3, and 5 can run in parallel (different files, no dependencies between them), reducing the critical path to **~10 days** for agency MVP.
