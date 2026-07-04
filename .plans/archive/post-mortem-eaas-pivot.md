# ⚠️ POST-MORTEM — EaaS Multi-Tenant Pivot Plan

> [!CAUTION]
> **THIS IS A POST-MORTEM CONTINGENCY PLAN.**
> It is a ready-to-execute blueprint in case the current project vision stalls and we decide to pivot CommerceJS into a multi-tenant ecommerce-as-a-service platform.
> **Do NOT reference this plan for active sprint planning or feature work.**
> Active roadmap: [roadmap.md](roadmap.md) · Backup options: [post-mortem-backup-plan.md](post-mortem-backup-plan.md)

---

## Vision

**CommerceJS becomes a multi-tenant commerce backend** — merchants sign up, get a storefront + admin + API + dedicated database, and start selling. No infrastructure knowledge required.

Think: **Shopify's backend simplicity** × **Medusa's open-source flexibility** × **Vercel's developer experience**.

One shared deployment serves all merchants. Each merchant gets their own **dedicated database** — provisioned automatically. CommerceJS Cloud manages billing, resources, and lifecycle.

---

## Why This Pivot Makes Sense

We already have every building block:

| Building Block | Status | What It Becomes in EaaS |
|---------------|--------|------------------------|
| `@commercejs/platform` | ✅ 12 domains, Admin API | The shared commerce engine |
| `@commercejs/types` | ✅ 26+ domain types | The API contract |
| `@commercejs/nuxt` | ✅ 46 routes, 16 composables | Storefront SDK for tenants |
| `@commercejs/checkout` | ✅ State machine | Shared checkout infrastructure |
| Payment/Delivery/Notification providers | ✅ 7 providers | Pluggable per merchant |
| `@commercejs/cloud` + `NeonProvider` | ✅ Auto-provisions Neon DBs | **Already does merchant DB provisioning** |
| Profile system | ✅ Cross-merchant identity | Buyer identity across merchants |
| Dashboard app | ✅ MVP (auth, projects) | Becomes the merchant console |

**The gap is tenant routing + billing.** The provisioning already works.

---

## Architecture: Shared Compute, Dedicated Data

```
┌─────────────────────────────────────────────────────────┐
│                   CONTROL PLANE                         │
│  Dashboard · Billing · Merchant Provisioning · API Keys │
│  (one Neon "control" database for Cloud metadata)       │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
   ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
   │ Merchant A │  │ Merchant B │  │ Merchant C │
   │ store-a.   │  │ store-b.   │  │ store-c.   │
   │ cjs.store  │  │ cjs.store  │  │ cjs.store  │
   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
         │               │               │
         └───────┬───────┼───────┬───────┘
                 │       │       │
         ┌───────▼───────▼───────▼───────┐
         │       SHARED COMPUTE          │
         │  One deployment (Fly / Node)  │
         │  Tenant middleware resolves   │
         │  merchant → connection string │
         └───────┬───────┬───────┬───────┘
                 │       │       │
         ┌───────▼──┐ ┌──▼──────┐ ┌──▼───────┐
         │ Neon DB A │ │ Neon DB B│ │ Neon DB C│
         │  (own     │ │  (own    │ │  (own    │
         │  project  │ │  project │ │  project │
         │  or       │ │  or      │ │  or      │
         │  branch)  │ │  branch) │ │  branch) │
         └──────────┘ └──────────┘ └──────────┘
```

### Why DB-Per-Merchant (Not Shared DB)

| Shared DB + merchant_id | Dedicated DB per merchant |
|------------------------|--------------------------|
| ❌ RLS complexity (must audit every query) | ✅ Zero risk of data leaks — physically separate |
| ❌ Schema customization is impossible | ✅ Each DB can evolve independently |
| ❌ Noisy neighbor (big store tanks small store) | ✅ Neon scales each DB independently |
| ❌ One migration affects all tenants | ✅ Rolling migrations (upgrade tenants in waves) |
| ✅ One DB to manage | ❌ Many DBs to manage → **automated by Neon API** |
| ✅ Cheaper at very small scale | ❌ Per-DB cost → **Neon's scale-to-zero solves this** |

**Neon makes dedicated-DB viable for any scale.** Each Neon project scales to zero when idle (no cost for inactive stores). The `NeonProvider` in `@commercejs/cloud` already auto-provisions them.

### Neon Topology Options

| Option | How | Best For |
|--------|-----|----------|
| **Branch per merchant** | One Neon project, each merchant = a branch | Cost-efficient for <100 merchants, shared compute endpoint |
| **Project per merchant** | Each merchant = own Neon project | Full isolation, independent scaling, unlimited merchants |

**Recommendation:** Start with branches (cheaper, simpler). Graduate large merchants to own projects when they need it. The `createPlatformAdapter({ connectionString })` API doesn't care — it just needs a connection string.

---

## Tenant Resolution

Every request resolves to a merchant. The middleware looks up the merchant's connection string:

```
Request → Resolve Merchant → Fetch Connection String → Inject DB → Handle
```

Three resolution mechanisms:

```
1. SUBDOMAIN:     store-a.cjs.store       → merchantId = "store-a"
2. API KEY:       X-Commerce-Key: sk_…    → merchantId from control DB
3. CUSTOM DOMAIN: myshop.com              → merchantId from control DB domains table
```

```ts
// Pseudocode — server/middleware/tenant.ts
export default defineEventHandler(async (event) => {
  const merchantId = resolveMerchant(event)
  const merchant = await getMerchantConfig(merchantId)  // control DB lookup, cached
  
  // Create a platform adapter scoped to this merchant's DB
  const { adapter, admin } = await createPlatformAdapter({
    connectionString: merchant.databaseUrl,
    currency: merchant.currency,
  })
  
  event.context.merchant = merchant
  event.context.adapter = adapter
  event.context.admin = admin
})
```

**Connection string caching:** Merchant configs are cached in-memory (or Redis/KV) with a TTL. The control DB is only hit on cache miss or merchant changes. At 1000 merchants, this is ~1000 cached strings — trivial memory.

---

## Two Databases, Two Purposes

| Database | Content | Technology |
|----------|---------|------------|
| **Control DB** | Merchants, API keys, billing, domains, deploy history | One Neon project (or Fly Postgres) — shared |
| **Merchant DB** (×N) | Products, orders, customers, carts, reviews, etc. | One Neon branch/project per merchant — isolated |

The control DB is what the current dashboard D1 schema becomes. The merchant DBs use the existing `@commercejs/platform` Drizzle schema unchanged.

---

## Provisioning Flow

```
Merchant Signs Up
    │
    ▼
┌─────────────────────────────┐
│ 1. Create merchant record   │  ← Control DB
│    in control database      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 2. Provision Neon DB        │  ← NeonProvider.createProject()
│    (branch or project)      │     Already implemented!
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 3. Run Drizzle migrations   │  ← migrateDrizzle(connectionString)
│    on the new DB            │     Already implemented!
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 4. Seed initial data        │  ← seedDrizzle() + admin user
│    (store info, admin)      │     Already implemented!
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 5. Store connection string  │  ← Control DB
│    + assign subdomain       │
└──────────────┬──────────────┘
               │
               ▼
   Merchant's store is live at
   store-name.cjs.store
```

**Steps 2–4 already exist** in the codebase. Step 1 and 5 are the new control plane logic. The current deploy pipeline does steps 2–4 via `DeployOrchestrator` — we just decouple it from CF Pages deployment.

---

## Infrastructure: Beyond Cloudflare

### Cloudflare Runtime Obstacles (From Our Experience)

These are **real issues we hit** during development, not theoretical concerns. Every one is documented in `.memory/gotchas.md` or `.memory/decisions.md`:

**Runtime Restrictions:**
- **WASM compilation banned** — `WebAssembly.instantiate()` is blocked. Prisma's WASM client crashed on deploy. Required a post-build patching script (`patch-wasm.mjs`) to rewrite glue code. *(gotchas: 2026-02-19)*
- **`nodejs_compat` required for everything** — Nuxt 4 uses `node:buffer`, `node:process`. First deploy of every new project fails without it. Can't set it via CLI (`--compatibility-flag` doesn't work with `wrangler pages deploy`), must set via API at project creation. *(gotchas: 2026-02-26)*
- **30s CPU limit** — Admin operations like bulk product imports, data migrations, and large order exports will timeout. No workaround on Workers.
- **No WebSocket support without Durable Objects** — Real-time admin dashboard (order notifications, live inventory) requires Durable Objects, which adds significant complexity.

**Module & Build Issues:**
- **npm module server routes don't resolve** — `addServerScanDir` does NOT work for published npm modules. Auto-imports don't resolve in `node_modules`. Compile-time macros like `defineRouteMeta` aren't stripped from pre-compiled dist files. This was our biggest recent debugging effort. *(gotchas: 2026-03-02)*
- **Nitro externals banned on Workers** — Relative imports from npm dist files fail with "externals are not allowed." Required complete rearchitecture of how `@commercejs/nuxt` registers server routes. *(gotchas: 2026-03-02)*
- **Vite plugins array undefined** — `nuxt.options.vite.plugins` is undefined in CF's build environment, crashes module setup. Required defensive initialization. *(gotchas: 2026-02-19)*
- **`unwasm` conflicts** — Nitro's internal WASM plugin uses `order: 'pre'` hooks that preempt custom Rollup plugins. Can't intercept or customize. *(gotchas: 2026-02-19)*

**Platform Limitations:**
- **Pages = one project per site** — Can't share a single deployment across multiple merchants. Each store requires its own CF Pages project, its own build, its own deploy. This is fundamentally incompatible with shared-compute multi-tenancy.
- **D1 is SQLite, not Postgres** — Dashboard uses D1 which lacks Postgres features (JSONB, array types, full-text search, CTEs). Already using Neon for merchant data, so D1 is a second database system to maintain.
- **wrangler binary resolution in monorepos** — `npx wrangler` doesn't work in pnpm monorepos. Required custom binary resolution from the cloud package's `node_modules/.bin/`. *(gotchas: 2026-02-26)*
- **KV returns 400 (not 409) for duplicates** — API inconsistency across CF products broke idempotent create operations. *(gotchas: 2026-02-26)*

**Bottom line:** Cloudflare is excellent as a CDN and DNS provider. As a compute platform for a multi-tenant commerce backend, the runtime restrictions, module resolution failures, and per-project deployment model make it an ongoing source of friction that compounds with each new feature.

### Shared Infrastructure (All Options)

Regardless of which provider hosts the compute, these are constant:

| Layer | Technology | Why |
|-------|-----------|-----|
| **Merchant DBs** | Neon (branch or project per merchant) | Scale-to-zero, auto-provisioning API, branching for previews |
| **Control DB** | Neon (one dedicated project) | Same Drizzle ORM, same tooling |
| **CDN / DNS** | Cloudflare (free tier) | DDoS protection, SSL, wildcard DNS for `*.cjs.store` |
| **Object Storage** | Cloudflare R2 or AWS S3 | Per-merchant media buckets (`@commercejs/storage-s3` already works) |
| **Cache** | Upstash Redis | Merchant config cache, session store (serverless, global) |

### Nitro Preset Change (Applies to All)

The entire migration from Cloudflare to any container platform starts with one config change:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    // Before (Cloudflare)
    // preset: 'cloudflare-pages',
    
    // After (any container platform)
    preset: 'node-server',
  }
})
```

This produces a standard Node.js server in `.output/server/index.mjs`. All three providers below run this same artifact.

### Shared Dockerfile

All three providers use the same Dockerfile:

```dockerfile
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build stage
FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
COPY apps/dashboard/ apps/dashboard/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter dashboard build

# Runtime stage
FROM base AS runtime
WORKDIR /app
COPY --from=build /app/apps/dashboard/.output .output/
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

---

### Option 1: Fly.io ⭐ (Recommended)

**Why:** Global edge network (35+ regions), full Docker containers, built-in load balancing, WebSocket support, machine-level autoscaling. Closest to Cloudflare's global presence but without runtime restrictions.

#### Setup

```toml
# fly.toml
app = "commercejs-cloud"
primary_region = "bah"  # Bahrain (closest to MENA)

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  NITRO_PRESET = "node-server"
  # Neon control DB
  CONTROL_DATABASE_URL = "postgresql://...@ep-xxx.us-east-2.aws.neon.tech/control"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "suspend"   # scale to zero when idle
  auto_start_machines = true       # wake on request
  min_machines_running = 1         # always keep 1 warm

  [http_service.concurrency]
    type = "requests"
    hard_limit = 250
    soft_limit = 200

# Scale to additional regions as merchants grow
# fly scale count 2 --region bah,ams
```

#### Deploy Commands

```bash
# First time
fly launch --name commercejs-cloud --region bah --no-deploy
fly secrets set CONTROL_DATABASE_URL="postgresql://..." NEON_API_KEY="..."
fly deploy

# Subsequent
fly deploy

# Scale to more regions
fly scale count 2 --region bah,ams    # Bahrain + Amsterdam
fly scale count 3 --region bah,ams,iad  # + US East

# Horizontal scaling (auto)
fly autoscale set min=1 max=10
```

#### Background Jobs

```toml
# fly.toml — add a worker process
[processes]
  web = "node .output/server/index.mjs"
  worker = "node .output/worker.mjs"  # BullMQ consumer for emails, imports, webhooks
```

```ts
// worker.ts — runs alongside the web server
import { Worker } from 'bullmq'
import { Redis } from 'ioredis'

const connection = new Redis(process.env.REDIS_URL!)

new Worker('merchant-jobs', async (job) => {
  switch (job.name) {
    case 'send-email': /* notification provider */ break
    case 'import-products': /* bulk CSV import */ break
    case 'dispatch-webhook': /* webhook-verifier */ break
  }
}, { connection })
```

#### Custom Domains (Wildcard)

```bash
# Wildcard SSL for all merchant subdomains
fly certs add "*.cjs.store"
fly certs add "cjs.store"

# Per-merchant custom domains (automated via API)
fly certs add "myshop.com"  # or via Fly Machines API
```

#### Pricing Breakdown

| Resource | Spec | Cost |
|----------|------|------|
| Shared VM (1 web) | 1 vCPU, 256MB | ~$3/mo (auto-suspend saves more) |
| Shared VM (2 web, HA) | 2× 1 vCPU, 256MB | ~$6/mo |
| Shared VM (scaled) | 4× 1 vCPU, 512MB | ~$24/mo |
| Upstash Redis | Serverless, pay-per-command | ~$0–10/mo |
| Bandwidth | First 100GB free | $0.02/GB after |
| **Total (start)** | | **~$3–6/mo** |
| **Total (100 merchants)** | | **~$24–40/mo** |

#### Tradeoffs

| ✅ Pros | ❌ Cons |
|---------|---------|
| Global edge (35+ regions) | Smaller ecosystem than AWS |
| Auto-suspend (scale to zero) | Occasional cold starts (~200ms) |
| WebSocket + streaming native | No managed Redis (use Upstash) |
| `fly deploy` is fast (~30s) | Region availability varies |
| Predictable per-VM pricing | Less enterprise features vs AWS |

---

### Option 2: Railway

**Why:** Simplest deployment experience. GitHub push-to-deploy, zero config, built-in Postgres and Redis if needed. Best for fastest time-to-market without ops overhead.

#### Setup

```json
// railway.json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node .output/server/index.mjs",
    "healthcheckPath": "/api/_health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

Or skip the Dockerfile entirely — Railway detects Nuxt and builds automatically:

```json
// railway.json (Nixpacks auto-detect)
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node .output/server/index.mjs",
    "healthcheckPath": "/api/_health"
  }
}
```

#### Deploy Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# First time
railway login
railway init
railway up

# Subsequent — push-to-deploy via GitHub
git push origin main  # Railway auto-deploys

# Or manual
railway up
```

#### Environment Variables

```bash
railway variables set CONTROL_DATABASE_URL="postgresql://..."
railway variables set NEON_API_KEY="..."
railway variables set UPSTASH_REDIS_URL="..."
```

#### Background Jobs

Railway runs separate services in the same project:

```bash
# Create a worker service alongside the web service
railway service create worker
railway variables set --service worker REDIS_URL="..."
# Worker runs: node .output/worker.mjs
```

#### Custom Domains

```bash
# Via Railway dashboard or CLI
railway domain add "cjs.store"
railway domain add "*.cjs.store"  # wildcard
# Per-merchant custom domains via Railway API
```

#### Pricing Breakdown

| Resource | Spec | Cost |
|----------|------|------|
| Hobby plan | 512MB, 1 vCPU, $5 credit | $5/mo |
| Pro plan | 8GB, 8 vCPU, $10 credit | $20/mo base + usage |
| Compute (Pro) | Per vCPU-minute | ~$0.000231/min |
| Memory (Pro) | Per GB-minute | ~$0.000231/min |
| Bandwidth | Per GB | $0.10/GB |
| **Total (start, Pro)** | | **~$20–25/mo** |
| **Total (100 merchants)** | | **~$40–80/mo** |

#### Tradeoffs

| ✅ Pros | ❌ Cons |
|---------|---------|
| Zero-config deploys | US regions only (US West, US East) |
| GitHub push-to-deploy | No edge/global presence |
| Built-in Postgres + Redis | Higher cost per resource than Fly |
| Excellent dashboard UI | Less mature autoscaling |
| Nixpacks = no Dockerfile needed | Cold starts less optimized |

---

### Option 3: DigitalOcean App Platform

**Why:** Mature, well-documented, competitive pricing. Has managed Postgres, Redis, and Spaces (S3-compatible storage). Good middle ground between simplicity and control.

#### Setup

```yaml
# .do/app.yaml
name: commercejs-cloud
region: fra  # Frankfurt (close to MENA via EU)

services:
  - name: web
    dockerfile_path: Dockerfile
    http_port: 3000
    instance_count: 1
    instance_size_slug: apps-s-1vcpu-0.5gb  # $5/mo
    routes:
      - path: /
    health_check:
      http_path: /api/_health
      initial_delay_seconds: 10
      period_seconds: 30
    envs:
      - key: NODE_ENV
        value: "production"
      - key: CONTROL_DATABASE_URL
        value: "postgresql://..."
        type: SECRET
      - key: NEON_API_KEY
        value: "..."
        type: SECRET

  - name: worker
    dockerfile_path: Dockerfile
    instance_count: 1
    instance_size_slug: apps-s-1vcpu-0.5gb
    run_command: node .output/worker.mjs
    envs:
      - key: REDIS_URL
        value: "${redis.REDIS_URL}"
        type: SECRET

databases:
  - name: redis
    engine: REDIS
    version: "7"
    size: db-s-1vcpu-1gb  # $15/mo
```

#### Deploy Commands

```bash
# Install doctl CLI
brew install doctl
doctl auth init

# Create app from spec
doctl apps create --spec .do/app.yaml

# Subsequent — push-to-deploy via GitHub integration
git push origin main  # DO auto-deploys

# Or manual
doctl apps create-deployment <app-id>

# Scale up
doctl apps update <app-id> --spec .do/app-scaled.yaml
```

#### Alternative: DigitalOcean Droplets (More Control, Cheaper)

For maximum cost efficiency, skip App Platform and use a droplet with Docker:

```bash
# Create a droplet
doctl compute droplet create commercejs \
  --region fra1 \
  --size s-2vcpu-4gb \  # $24/mo — 2 vCPU, 4GB RAM
  --image docker-20-04

# SSH in and deploy
ssh root@<droplet-ip>
docker compose up -d
```

```yaml
# docker-compose.yml (on the droplet)
services:
  web:
    build: .
    ports: ["3000:3000"]
    environment:
      CONTROL_DATABASE_URL: "postgresql://..."
      NEON_API_KEY: "..."
      REDIS_URL: "redis://redis:6379"
    restart: unless-stopped

  worker:
    build: .
    command: node .output/worker.mjs
    environment:
      REDIS_URL: "redis://redis:6379"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes: ["redis-data:/data"]
    restart: unless-stopped

  caddy:  # reverse proxy + auto SSL
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
    restart: unless-stopped

volumes:
  redis-data:
  caddy-data:
```

```
# Caddyfile — auto SSL + wildcard subdomain routing
*.cjs.store, cjs.store {
  reverse_proxy web:3000
  tls {
    dns cloudflare {env.CF_API_TOKEN}
  }
}
```

#### Custom Domains

```bash
# App Platform
doctl apps update <app-id> --spec .do/app.yaml  # add domains in spec

# Droplet — handled by Caddy automatically
# Just update DNS to point at the droplet IP
```

#### Pricing Breakdown

**App Platform:**

| Resource | Spec | Cost |
|----------|------|------|
| Basic plan (web) | 1 vCPU, 512MB | $5/mo |
| Pro plan (web) | 1 vCPU, 1GB | $12/mo |
| Worker service | 1 vCPU, 512MB | $5/mo |
| Managed Redis | 1 vCPU, 1GB | $15/mo |
| Bandwidth | 1TB included | $0 |
| **Total (start)** | | **~$22–32/mo** |
| **Total (100 merchants, scaled)** | | **~$50–90/mo** |

**Droplet (self-managed):**

| Resource | Spec | Cost |
|----------|------|------|
| Droplet | 2 vCPU, 4GB RAM | $24/mo |
| Spaces (S3 storage) | 250GB included | $5/mo |
| Bandwidth | 4TB included | $0 |
| Upstash Redis | Serverless | ~$0–10/mo |
| **Total** | | **~$29–39/mo** |

#### Tradeoffs

| ✅ Pros | ❌ Cons |
|---------|---------|
| Mature platform (10+ years) | No global edge (single region per app) |
| Managed Postgres, Redis, S3 (Spaces) | App Platform less flexible than Fly |
| Competitive pricing | Slower deploys (~3-5min) |
| Excellent documentation | No auto-suspend (pays even idle) |
| Droplet option = cheapest at scale | Droplet = self-managed ops |
| 1TB bandwidth included | Limited autoscaling on App Platform |

---

### Provider Comparison Matrix

| Feature | Fly.io ⭐ | Railway | DigitalOcean (App) | DigitalOcean (Droplet) |
|---------|-----------|---------|-------------------|----------------------|
| **Deploy DX** | `fly deploy` (~30s) | `git push` (auto) | `doctl` or `git push` | Manual Docker |
| **Global edge** | ✅ 35+ regions | ❌ US only | ❌ Single region | ❌ Single region |
| **Scale to zero** | ✅ Auto-suspend | ❌ | ❌ | ❌ |
| **WebSockets** | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| **Background jobs** | ✅ Multi-process | ✅ Multi-service | ✅ Worker service | ✅ Docker Compose |
| **Wildcard SSL** | ✅ Built-in | ✅ Built-in | ⚠️ Limited | ✅ Via Caddy |
| **Managed Redis** | ❌ (use Upstash) | ✅ Built-in | ✅ Built-in | ❌ (self-hosted) |
| **Start cost** | ~$3–6/mo | ~$20–25/mo | ~$22–32/mo | ~$29–39/mo |
| **100 merchant cost** | ~$24–40/mo | ~$40–80/mo | ~$50–90/mo | ~$34–49/mo |
| **Best for** | Global, auto-scale | Fastest setup | Balanced | Cheapest at scale |

### Recommendation

**Primary: Fly.io** — best combination of global presence, auto-scaling, and container flexibility. Start in `bah` (Bahrain) region for MENA merchants.

**Fallback: Railway** — if Fly.io's DX or reliability disappoints, Railway is zero-config and gets you deployed in minutes.

**Budget option: DigitalOcean Droplet** — if cost is the primary concern and you're comfortable with Docker Compose + Caddy, a single $24/mo droplet handles hundreds of merchants.

---

## What Changes From Current Architecture

### New Packages

| Package | Purpose |
|---------|---------|
| `@commercejs/tenant` | Merchant resolution middleware, connection string cache, API key management |
| `@commercejs/billing` | Subscription management, usage metering, Stripe/Tap recurring payments |

### Modified Packages

| Package | Changes |
|---------|---------|
| `@commercejs/platform` | No schema changes needed — each merchant gets a clean DB with the existing schema |
| `@commercejs/core` | `createCommerce()` receives merchant context; EventBus namespaced per merchant |
| `@commercejs/nuxt` | Tenant middleware injected into server routes; adapter created per-request |
| `@commercejs/cloud` | Refactor: add `InfraProvider` interface abstracting CF/Fly/Railway; keep `NeonProvider` |

### Deprecated / Archived

| Asset | Reason |
|-------|--------|
| Per-project CF Pages provisioning | Replaced by shared deployment + tenant routing |
| `@commercejs/cli` deploy command | Dashboard handles all provisioning |
| GH Actions auto-deploy per merchant | One deployment, not per-merchant deploys |

---

## Rollout Phases

### Phase A: Shared Compute + DB-Per-Merchant (4–5 weeks)

1. Build `@commercejs/tenant` (resolution middleware, config cache, API key CRUD)
2. Set up control DB schema (merchants, api_keys, domains, billing)
3. Build merchant provisioning API (signup → Neon DB → migrate → seed → subdomain)
4. Modify Nuxt server routes to use tenant-injected adapter (not global singleton)
5. Deploy single shared instance on Fly.io
6. Verify: two merchants on one deployment, fully isolated data

### Phase B: Dashboard & Merchant Onboarding (3–4 weeks)

1. Refactor dashboard: merchant signup, store settings, subdomain picker
2. Admin panel per merchant (products, orders, settings — reuse existing Admin API)
3. Custom domain setup (CNAME → verify → SSL via Cloudflare or Fly)
4. Storefront template selection (clone template, point at merchant's DB)

### Phase C: Billing & Resource Management (2–3 weeks)

1. Build `@commercejs/billing` (Stripe Billing or Tap recurring)
2. Usage metering: API calls, storage, DB compute hours (Neon reports these)
3. Plan limits enforcement (product count, bandwidth, storage)
4. Dashboard billing page (plan, invoices, upgrade)
5. Trial period mechanics (14 days free → require payment)

### Phase D: Scale & Polish (Ongoing)

1. Merchant-level caching (Upstash Redis, namespaced by merchant)
2. Background job queue for imports, email dispatch, webhook retry
3. Monitoring dashboard (per-merchant error rates, latency, DB usage)
4. Data export / takeout (merchant downloads their full DB dump)
5. Storefront theme marketplace

---

## Go-To-Market: Self-Service vs. Agency vs. Hybrid

The platform supports **both** models — the difference is mostly in the onboarding flow, billing setup, and dashboard features. The core infrastructure (shared compute, DB-per-merchant, tenant resolution) is identical.

---

### Model 1: Self-Service SaaS

**"Sign up, pick a template, start selling."**

Merchants find you online, sign up, and manage everything themselves. You build the platform, they use it.

#### User Journey

```
Landing page → Sign up (email/Google) → Verify email → Pick subdomain
    → Choose template → Auto-provision DB → Seed catalog → Live store
    → Dashboard: add products, configure payments, set up delivery
    → 14-day trial → Enter payment → Pro plan active
```

#### Implementation Requirements

**Signup & Onboarding:**

```ts
// server/api/auth/register.post.ts
export default defineEventHandler(async (event) => {
  const { email, password, storeName } = await readBody(event)
  
  // 1. Create merchant account in control DB
  const merchant = await createMerchant({ email, password, storeName })
  
  // 2. Assign subdomain (slugified store name)
  const subdomain = slugify(storeName) // → "bakers-bakery"
  await assignSubdomain(merchant.id, subdomain)
  
  // 3. Auto-provision dedicated Neon DB (async via job queue)
  await enqueueJob('provision-store', {
    merchantId: merchant.id,
    subdomain,
    template: 'default', // or user-selected
  })
  
  // 4. Send welcome email
  await sendEmail(merchant.email, 'welcome', { subdomain })
  
  // 5. Return session token
  return { token: createSession(merchant.id), subdomain }
})
```

**Store Provisioning Worker:**

```ts
// worker/jobs/provision-store.ts
async function provisionStore(job: { merchantId: string, subdomain: string, template: string }) {
  const neon = new NeonProvider(config.neon)
  
  // 1. Create Neon branch (or project)
  const { connectionString } = await neon.createBranch(job.merchantId)
  
  // 2. Run migrations
  await migrateDrizzle(connectionString)
  
  // 3. Seed from template (demo products, categories, default settings)
  await seedFromTemplate(connectionString, job.template)
  
  // 4. Create initial admin user (same email as merchant)
  await seedAdmin(connectionString, job.merchantId)
  
  // 5. Update control DB — store is now live
  await updateMerchant(job.merchantId, {
    status: 'active',
    databaseUrl: connectionString,
    subdomain: job.subdomain,
  })
}
```

**Self-Service Dashboard Pages:**

| Page | What It Does |
|------|-------------|
| `/onboarding` | Template picker, subdomain, initial setup wizard |
| `/dashboard` | Overview: orders today, revenue, low stock alerts |
| `/dashboard/products` | CRUD products (uses existing Admin API) |
| `/dashboard/orders` | Order list, status updates, fulfillment |
| `/dashboard/settings` | Store info, currency, timezone, logo |
| `/dashboard/payments` | Connect Tap/Stripe (API key entry or OAuth) |
| `/dashboard/delivery` | Configure shipping methods, delivery zones |
| `/dashboard/domains` | Custom domain setup (CNAME instructions + verify) |
| `/dashboard/billing` | Current plan, usage, upgrade, payment history |
| `/dashboard/storefront` | Theme picker, color/font customization |

**Template System:**

```ts
// Templates are seed data sets + storefront theme configs
interface StoreTemplate {
  id: string                    // 'default', 'fashion', 'food', 'electronics'
  name: string                  // "Fashion Boutique"
  seedData: {
    products: ProductSeed[]     // 5-10 demo products with images
    categories: CategorySeed[]
    storeSettings: StoreSettings
  }
  theme: {
    primaryColor: string
    fontFamily: string
    layout: 'grid' | 'list' | 'masonry'
    heroStyle: 'banner' | 'carousel' | 'minimal'
  }
}
```

#### Self-Service Monetization

| Tier | Price | Target | Key Limits |
|------|-------|--------|-----------|
| **Trial** | Free (14 days) | Everyone | Watermarked storefront, 10 products |
| **Starter** | $9/mo | Side hustles | 100 products, 500 orders/mo, subdomain only |
| **Pro** | $29/mo | Small businesses | Unlimited products/orders, custom domain, 5GB media |
| **Business** | $79/mo | Growing brands | + Analytics, API access, 50GB media, priority support |
| **Enterprise** | Custom | Large merchants | Dedicated DB, SLA, SSO, custom integrations |

**No GMV fees** — always.

**Billing Implementation:**

```ts
// Using Stripe Billing for international, Tap for GCC
// server/api/billing/subscribe.post.ts
export default defineEventHandler(async (event) => {
  const merchant = event.context.merchant
  const { planId } = await readBody(event)
  
  // Create Stripe subscription
  const subscription = await stripe.subscriptions.create({
    customer: merchant.stripeCustomerId,
    items: [{ price: PLAN_PRICES[planId] }],
    trial_period_days: 14,
    metadata: { merchantId: merchant.id },
  })
  
  // Update merchant plan in control DB
  await updateMerchant(merchant.id, { plan: planId, subscriptionId: subscription.id })
})

// Stripe webhook handles payment success/failure
// server/api/webhooks/stripe.post.ts
// → upgrade/downgrade/suspend merchant based on subscription events
```

**Plan Enforcement Middleware:**

```ts
// server/middleware/plan-limits.ts
export default defineEventHandler(async (event) => {
  const merchant = event.context.merchant
  if (!merchant) return
  
  // Check trial expiry
  if (merchant.plan === 'trial' && isExpired(merchant.trialEndsAt)) {
    throw createError({ statusCode: 402, message: 'Trial expired. Please upgrade.' })
  }
  
  // Check product limits on create
  if (event.path.includes('/products') && event.method === 'POST') {
    const count = await getProductCount(merchant.id)
    if (count >= PLAN_LIMITS[merchant.plan].maxProducts) {
      throw createError({ statusCode: 403, message: 'Product limit reached. Upgrade your plan.' })
    }
  }
})
```

**Revenue projections (self-service):**

| Milestone | Merchants | MRR | Timeline |
|-----------|-----------|-----|----------|
| Launch | 10 | $290 | Month 1 |
| Traction | 50 | $1,450 | Month 3 |
| Growth | 200 | $5,800 | Month 6 |
| Scale | 1,000 | $29,000 | Month 12+ |

---

### Model 2: Agency Service

**"We build your store. You sell."**

You (or your team) build stores for clients. Merchants pay you for setup, customization, and ongoing management. The platform is your internal tool.

#### Client Journey

```
Client inquiry → Discovery call → Proposal + quote → Contract signed
    → You provision their store → Custom theme/design → Migrate their data
    → Configure payments + delivery → QA + launch → Handoff or managed
    → Monthly retainer (hosting + support) or one-time fee
```

#### Implementation Differences

The platform is the same, but the dashboard and onboarding look different:

**No public signup.** You create stores via an internal admin panel or CLI:

```ts
// Internal-only: admin creates a merchant
// server/api/admin/merchants.post.ts (protected by admin auth)
export default defineEventHandler(async (event) => {
  assertAdmin(event) // only your team can access this
  
  const { clientName, clientEmail, subdomain, template, customTheme } = await readBody(event)
  
  // Provision exactly like self-service, but with more customization
  const merchant = await createMerchant({
    name: clientName,
    email: clientEmail,
    plan: 'agency-managed', // special plan, no self-serve billing
    provisionedBy: event.context.adminUser.id,
  })
  
  await enqueueJob('provision-store', {
    merchantId: merchant.id,
    subdomain,
    template,
    customTheme, // agency can inject custom theme at provision time
  })
  
  return merchant
})
```

**White-Label Dashboard:**

The merchant sees a dashboard branded to your agency, not "CommerceJS":

```ts
// nuxt.config.ts — per-merchant branding
export default defineNuxtConfig({
  // Default branding
  runtimeConfig: {
    public: {
      brandName: 'CommerceJS',     // or your agency name
      brandLogo: '/logo.svg',
      supportEmail: 'support@youragency.com',
      showPoweredBy: false,        // hide "Powered by CommerceJS"
    }
  }
})
```

**Client Admin Panel (Simplified):**

Agency clients get a simpler dashboard — no billing, no infrastructure settings:

| Page | Self-Service | Agency Client |
|------|-------------|---------------|
| Products CRUD | ✅ | ✅ |
| Orders management | ✅ | ✅ |
| Store settings | ✅ Full | ⚠️ Limited (name, logo, hours) |
| Payment config | ✅ Self-serve | ❌ You configure for them |
| Delivery config | ✅ Self-serve | ❌ You configure for them |
| Custom domain | ✅ DIY with instructions | ❌ You handle DNS |
| Billing/plan | ✅ Self-serve | ❌ Hidden (you invoice separately) |
| Theme/design | ✅ Template picker | ❌ Custom (you build it) |
| Developer API | ✅ (Business plan) | ❌ unless requested |

**Implementation — Role-Based Dashboard:**

```ts
// server/middleware/dashboard-role.ts
export default defineEventHandler(async (event) => {
  const merchant = event.context.merchant
  
  // Agency-managed merchants get restricted dashboard
  if (merchant.plan === 'agency-managed') {
    event.context.dashboardRole = 'client' // limited features
  } else {
    event.context.dashboardRole = 'owner'  // full features
  }
})
```

```vue
<!-- layouts/dashboard.vue -->
<template>
  <UDashboardSidebar>
    <UDashboardSidebarItem to="/dashboard" icon="i-heroicons-home" label="Overview" />
    <UDashboardSidebarItem to="/dashboard/products" icon="i-heroicons-cube" label="Products" />
    <UDashboardSidebarItem to="/dashboard/orders" icon="i-heroicons-shopping-bag" label="Orders" />
    <UDashboardSidebarItem to="/dashboard/settings" icon="i-heroicons-cog" label="Settings" />
    
    <!-- Only show for self-service merchants -->
    <template v-if="dashboardRole === 'owner'">
      <UDashboardSidebarItem to="/dashboard/payments" icon="i-heroicons-credit-card" label="Payments" />
      <UDashboardSidebarItem to="/dashboard/delivery" icon="i-heroicons-truck" label="Delivery" />
      <UDashboardSidebarItem to="/dashboard/billing" icon="i-heroicons-banknotes" label="Billing" />
      <UDashboardSidebarItem to="/dashboard/domains" icon="i-heroicons-globe-alt" label="Domains" />
      <UDashboardSidebarItem to="/dashboard/storefront" icon="i-heroicons-paint-brush" label="Storefront" />
    </template>
  </UDashboardSidebar>
</template>
```

**Custom Theme Development:**

For agency clients, you build custom Nuxt storefronts instead of using templates:

```
your-agency/
├── storefronts/
│   ├── client-bakery/        # custom storefront for Baker's Bakery
│   │   ├── nuxt.config.ts    # points at shared @commercejs/nuxt module
│   │   ├── pages/            # custom pages
│   │   ├── components/       # custom components
│   │   └── assets/           # client's brand assets
│   ├── client-fashion/       # custom storefront for Fashion Co
│   └── shared-theme/         # your base agency theme (reusable)
```

Each client storefront connects to their dedicated Neon DB via `DATABASE_URL`. The `@commercejs/nuxt` module provides all 46 API routes — you just build the frontend.

#### Agency Monetization

**Setup Fee (One-Time):**

| Service | Price | Includes |
|---------|-------|----------|
| **Basic Store Setup** | $500–$1,000 | Template-based, your branding, payment/delivery config |
| **Custom Store** | $2,000–$5,000 | Custom design, data migration, bespoke pages |
| **Enterprise Build** | $5,000–$15,000 | Full custom, integrations, training, multi-language |

**Monthly Retainer (Recurring):**

| Tier | Price | Includes |
|------|-------|----------|
| **Hosting Only** | $49/mo | Infrastructure, patches, uptime monitoring |
| **Managed** | $149/mo | + Content updates, product uploads, monthly report |
| **Full Service** | $299/mo | + Marketing support, SEO, analytics review |

**Revenue projections (agency):**

| Milestone | Clients | MRR (retainers) | Setup Revenue | Timeline |
|-----------|---------|-----------------|---------------|----------|
| Launch | 3 | $447 | $3,000 | Month 1 |
| Steady | 10 | $1,490 | $2,000/mo | Month 3 |
| Growth | 25 | $3,725 | $5,000/mo | Month 6 |
| Scale | 50 | $7,450 | $8,000/mo | Month 12+ |

---

### Model 3: Hybrid (Recommended)

**"Self-service for the many, agency for the few."**

Run both models on the same platform. Self-service merchants sign up and manage themselves. High-value clients get the white-glove agency treatment.

#### How They Coexist

```
                    ┌─────────────────────────┐
                    │    SAME PLATFORM        │
                    │    Same compute         │
                    │    Same DB-per-merchant  │
                    │    Same tenant resolver  │
                    └────────┬────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │                             │
    ┌─────────▼──────────┐       ┌──────────▼─────────┐
    │   SELF-SERVICE     │       │   AGENCY           │
    │                    │       │                    │
    │ • Public signup    │       │ • Internal create  │
    │ • Template themes  │       │ • Custom themes    │
    │ • Auto billing     │       │ • Manual invoicing │
    │ • Full dashboard   │       │ • Limited dashboard│
    │ • DIY support      │       │ • Hands-on support │
    │                    │       │                    │
    │ Plan: starter/pro/ │       │ Plan: agency-mgd   │
    │   business/ent     │       │                    │
    └────────────────────┘       └────────────────────┘
```

**The difference is a single field in the control DB:**

```sql
-- Control DB: merchants table
CREATE TABLE merchants (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  subdomain   TEXT NOT NULL UNIQUE,
  
  -- This field controls everything
  plan        TEXT NOT NULL DEFAULT 'trial',
  -- Values: 'trial', 'starter', 'pro', 'business', 'enterprise', 'agency-managed'
  
  database_url     TEXT NOT NULL,
  stripe_customer  TEXT,          -- NULL for agency (you invoice them)
  provisioned_by   TEXT,          -- NULL for self-service, admin ID for agency
  dashboard_role   TEXT DEFAULT 'owner',  -- 'owner' (full) or 'client' (limited)
  
  custom_domain    TEXT,
  status           TEXT DEFAULT 'provisioning',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at    TIMESTAMPTZ
);
```

**Dashboard routing based on plan:**

```ts
// composables/useDashboardFeatures.ts
export function useDashboardFeatures() {
  const merchant = useMerchant()
  
  return {
    // Full features for self-service, limited for agency clients
    showBilling:     computed(() => merchant.value.plan !== 'agency-managed'),
    showPaymentSetup: computed(() => merchant.value.plan !== 'agency-managed'),
    showDeliverySetup: computed(() => merchant.value.plan !== 'agency-managed'),
    showDomainSetup:  computed(() => merchant.value.plan !== 'agency-managed'),
    showThemePicker:  computed(() => merchant.value.plan !== 'agency-managed'),
    showDeveloperAPI: computed(() => ['business', 'enterprise'].includes(merchant.value.plan)),
    
    // All plans get these
    showProducts: true,
    showOrders: true,
    showSettings: true,
    showAnalytics: computed(() => merchant.value.plan !== 'starter'),
  }
}
```

#### Upsell Paths (Hybrid Revenue)

```
Self-Service Starter ($9/mo)
    │
    ├─→ Self-Service Pro ($29/mo)     — merchant upgrades themselves
    ├─→ Self-Service Business ($79/mo) — merchant upgrades themselves
    │
    └─→ Agency Custom Build ($2K–$5K) — merchant wants more than templates offer
            │
            └─→ Agency Managed ($149/mo) — ongoing retainer after custom build
```

```
Agency Client (custom build $2K+)
    │
    ├─→ Agency Managed ($149/mo) — you maintain the store
    │
    └─→ Self-Service Pro ($29/mo) — client wants to manage themselves
            (migrate from 'agency-managed' to 'pro' plan, unlock full dashboard)
```

#### Partner Program (Scale the Agency Model)

When you have enough agency demand, bring in other agencies:

```ts
// Control DB: partners table
interface Partner {
  id: string
  name: string            // "Web Agency Co"
  commission: number      // 20% of referred merchant MRR
  whitelabelDomain: string // "stores.webagency.com"
  apiKey: string          // partner provisioning API access
}
```

Partners get their own API key to provision stores, their own branding, and earn commission on referred merchants:

| Partner Tier | Commission | Perks |
|-------------|-----------|-------|
| **Affiliate** | 20% of MRR | Referral link only |
| **Reseller** | 30% of MRR | White-label dashboard, bulk pricing |
| **Agency Partner** | 40% of MRR | + Custom themes marketplace, priority support |

---

### Side-by-Side Implementation Comparison

| Aspect | Self-Service | Agency | Hybrid Effort |
|--------|-------------|--------|---------------|
| **Signup flow** | Public page, email verify, auto-provision | Internal admin panel, manual create | Build both (shared provisioning backend) |
| **Onboarding** | Wizard: template → subdomain → done | Discovery call → proposal → you build | Wizard for self-serve, manual for agency |
| **Store themes** | Template picker (5–10 templates) | Custom Nuxt storefront per client | Templates + custom both supported |
| **Dashboard** | Full-featured (all settings exposed) | Simplified (products + orders only) | `dashboardRole` flag controls visibility |
| **Payment config** | Merchant enters own Tap/Stripe keys | You configure for them | Same API, different who calls it |
| **Billing** | Stripe/Tap subscription (automated) | You invoice manually (or Stripe manual) | Stripe for self-serve, skip for agency |
| **Support** | Docs, email, community | Direct chat/call, SLA | Tiered by plan |
| **Custom domain** | Self-serve (CNAME instructions) | You handle DNS | Same backend, different UX |
| **Development effort** | ~6–8 weeks (signup + billing + templates) | ~2–3 weeks (admin panel + provisioning) | ~8–10 weeks (both) |

---

### Recommended Rollout Strategy

**Start with Agency (weeks 1–3)**, then add Self-Service (weeks 4–8):

#### Why Agency First

1. **Revenue from day 1** — charge for setup before building self-service automation
2. **Less to build** — no public signup, no billing integration, no template system needed yet
3. **Learn from real merchants** — their needs inform the self-service product
4. **Prove the platform** — 3–5 agency clients validate the infrastructure before scaling
5. **Cash flow** — setup fees ($500–$5K per client) fund self-service development

#### Phase 1: Agency Mode (Weeks 1–3)

1. Build internal admin: create merchant, provision DB, assign subdomain
2. Build simplified client dashboard (products, orders, settings)
3. Deploy shared compute instance (Fly.io)
4. Onboard 3–5 initial clients manually
5. Iterate based on their feedback

#### Phase 2: Self-Service Layer (Weeks 4–6)

1. Build public signup flow + email verification
2. Build store template system (3 templates minimum)
3. Integrate Stripe Billing (subscriptions, trials, upgrades)
4. Build plan enforcement middleware
5. Launch landing page

#### Phase 3: Hybrid Features (Weeks 7–8)

1. Dashboard role system (`owner` vs `client`)
2. Agency-to-self-service migration path
3. Self-service-to-agency upsell flow
4. Usage analytics for billing decisions

---

### Combined Revenue Model

| Source | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| Agency setup fees | $3,000 | $2,000 | $5,000 | $8,000 |
| Agency retainers | $447 | $1,490 | $3,725 | $7,450 |
| Self-service MRR | — | $290 | $1,450 | $14,500 |
| **Total MRR** | **$3,447** | **$3,780** | **$10,175** | **$29,950** |

**Infrastructure cost at 100 merchants:** ~$24–40/mo (Fly) + ~$200–500/mo (Neon) = **~$225–540/mo**

**Gross margin at scale: ~95%+**

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Neon branch limits per project | Low | Neon supports 100+ branches; graduate busy merchants to own projects |
| Connection storm (100 merchants × concurrent requests) | Medium | Neon's built-in connection pooler; Fly scales horizontally |
| Merchant provisioning fails mid-way | Medium | Idempotent provisioning (already learned from `DeployOrchestrator`) |
| Fly.io doesn't scale globally enough | Low | Railway or Hetzner as fallbacks; CDN handles most latency |
| Not enough demand | Medium | Validate with 5–10 MENA merchants before full build |

---

## Validation Before Full Build

1. **Landing page** — "Your own online store in 60 seconds. No GMV fees." with waitlist
2. **5 merchant interviews** — Would they pay $29/mo? What do they use now?
3. **Manual pilot** — Provision 3 stores by hand on shared Fly + separate Neon DBs, observe
4. **Competitor pricing audit** — Medusa Cloud, Saleor Cloud, Shopify Basic

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-10 | Plan created | Ready-to-execute EaaS blueprint if current Cloud vision stalls |
| 2026-03-10 | DB-per-merchant, not shared DB | Full data isolation, no RLS complexity, Neon scale-to-zero makes it cost-viable |
| 2026-03-10 | Fly.io as primary compute, CF as CDN only | Containers with no runtime limits; CF constraints don't fit multi-tenant shared compute |
| 2026-03-10 | Neon branches first, projects for enterprise | Branches are cheaper and share compute; upgrade path is transparent to application code |
| 2026-03-10 | Hybrid go-to-market: agency first, then self-service | Agency generates revenue from day 1 with less to build; funds self-service development |
| 2026-03-10 | Dashboard role system (`owner` vs `client`) | Single codebase serves both models; `plan` field controls feature visibility |
