# Provider Swap: Cloudflare → Fly.io (Same Architecture)

> Deep exploration of replacing Cloudflare Pages with Fly.io Machines
> while keeping the existing per-merchant deployment model intact.

---

## Core Concept

The current architecture: **one CF Pages project + one Neon DB per merchant**.
The swap: **one Fly App + one Neon DB per merchant**. Everything else stays.

Fly.io officially recommends this pattern: *"Deploy a separate app for each customer,
even if they share the same base Docker image."* — [Fly.io docs](https://fly.io/docs/blueprints/multi-tenant-saas/)

```
┌─────────────────────────────────────────────────────────┐
│                  CommerceJS Dashboard                    │
│           (still hosted on CF Pages or Fly)              │
│                                                         │
│  "Create Store" ──▶ FlyProvider.createApp()             │
│                  ──▶ NeonProvider.createProject()         │
│                  ──▶ FlyProvider.setSecrets()             │
│                  ──▶ FlyProvider.deployMachine()          │
│                  ──▶ FlyProvider.addCert()                │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
    │ Fly App  │         │ Fly App  │         │ Fly App  │
    │ cjs-acme │         │ cjs-zara │         │ cjs-nike │
    │ 256MB    │         │ 512MB    │         │ 1GB      │
    │ auto-sus │         │ always-on│         │ 2 region │
    └────┬────┘         └────┬────┘         └────┬────┘
         │                    │                    │
    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
    │ Neon DB  │         │ Neon DB  │         │ Neon DB  │
    │ branch   │         │ branch   │         │ project  │
    └─────────┘         └─────────┘         └─────────┘
```

---

## Method-by-Method API Mapping

### CloudflareProvider → FlyProvider

| # | CloudflareProvider Method | FlyProvider Equivalent | Fly API Endpoint | Notes |
|---|--------------------------|----------------------|-----------------|-------|
| 1 | `createPagesProject(name)` | `createApp(name, org, region)` | `POST /v1/apps` | Creates an empty Fly App |
| 2 | `deployPages(project, outputDir)` | `deployMachine(app, image, config)` | `POST /v1/apps/{app}/machines` | Creates a Machine from Docker image |
| 3 | `deletePagesProject(name)` | `destroyApp(name)` | `DELETE /v1/apps/{app}` | Removes app + all machines |
| 4 | `getDeployment(project, id)` | `getMachine(app, machineId)` | `GET /v1/apps/{app}/machines/{id}` | Returns machine state |
| 5 | `getDeploymentLogs(project, id)` | `getLogs(app)` | `GET /v1/apps/{app}/machines/{id}/logs` | Nats-based log streaming |
| 6 | `addCustomDomain(project, domain)` | `addCertificate(app, hostname)` | `POST /v1/apps/{app}/certificates` | Triggers Let's Encrypt |
| 7 | `removeCustomDomain(project, domainId)` | `removeCertificate(app, hostname)` | `DELETE /v1/apps/{app}/certificates/{hostname}` | |
| 8 | `setProjectEnvVars(project, vars)` | `setSecrets(app, secrets)` | `POST /v1/apps/{app}/secrets` | Encrypted at rest |
| 9 | `getProjectEnvVars(project)` | `listSecrets(app)` | `GET /v1/apps/{app}/secrets` | Names only (values redacted) |
| 10 | `createR2Bucket(name)` | *Not needed initially* | — | Use Neon for data, S3-compat for media later |
| 11 | `createKVNamespace(title)` | *Not needed* | — | Session storage via Neon or in-memory |
| 12 | `teardownProject(config)` | `destroyApp(name)` + `neon.deleteProject()` | — | Simpler — one call destroys all resources |

### DeployOrchestrator — Pipeline Mapping

| Pipeline Step | Current (CF) | New (Fly) |
|--------------|-------------|-----------|
| 1. Provision infra | `cloudflare.createPagesProject()` + `neon.createProject()` | `fly.createApp()` + `neon.createProject()` |
| 2. Install deps | `pnpm install` (in project dir) | Happens inside Docker build |
| 3. Run migrations | `pnpm db:migrate` (local exec) | `fly ssh console -C "npx prisma migrate deploy"` or part of Docker entrypoint |
| 4. Build Nuxt | `pnpm build` (NITRO_PRESET=cloudflare-pages) | Happens inside Docker build (NITRO_PRESET=node-server) |
| 5. Deploy | `wrangler pages deploy .output/public` | `fly deploy` (or `fly machine run` from pre-built image) |
| 6. Set env vars | `cloudflare.setProjectEnvVars()` | `fly.setSecrets()` |
| 7. Wait for active | Poll CF deployment API | `fly machine wait --state started` or poll Machines API |
| 8. Health check | `GET /` → expect 200 | Same — `GET /api/_health` → expect 200 |

### deploy-provisioner.ts — Step-by-Step Rewrite

| Step | Current Code | New Code |
|------|-------------|----------|
| 1 | Check/create CF Pages project (`POST /pages/projects`) | Check/create Fly App (`POST /v1/apps`) |
| 2 | Create Neon DB project | **Same** — unchanged |
| 3 | Set env vars on CF Pages (`PATCH /pages/projects/{name}`) | Set secrets on Fly App (`POST /v1/apps/{app}/secrets`) |
| 4 | Set GitHub Actions secrets (CF token, account ID, project name) | Set GitHub Actions secrets (Fly API token, app name) |
| 5 | Trigger GH Actions workflow dispatch | **Same** — unchanged |

---

## Two Deployment Models

### Model A: Shared Image (Recommended for Start)

Build the storefront template **once** → push to Fly registry → create Machines from it.

```
Dashboard:
  1. Build storefront image (one-time or on template update)
  2. Push to Fly registry: registry.fly.io/commercejs-storefront:latest
  3. Per merchant:
     a. fly.createApp("cjs-{merchant}")
     b. fly.setSecrets({ DATABASE_URL: "...", STORE_NAME: "...", ... })
     c. fly.createMachine({ image: "registry.fly.io/commercejs-storefront:latest" })
```

**Pros:**
- Provisioning takes ~5 seconds (no build per merchant)
- All merchants run a tested, identical image
- Update all merchants at once by updating the image
- No GitHub repos needed for merchants

**Cons:**
- No custom code per merchant (fixed storefront theme)
- Theme customization only via config/CSS, not code

### Model B: Per-Merchant Builds (Full Original Vision)

Each merchant has their own GitHub repo → CI builds a Docker image → deploys to their Fly App.

```
Merchant GitHub Repo:
  1. Merchant pushes code
  2. GH Actions: docker build → push to Fly registry
  3. GH Actions: fly deploy --app cjs-{merchant}

Dashboard Provisioning:
  1. fly.createApp("cjs-{merchant}")
  2. neon.createProject("cjs-{merchant}")
  3. Set GH Actions secrets on merchant's repo (FLY_API_TOKEN, DATABASE_URL)
  4. Trigger first GH Actions deploy
```

**Pros:**
- Full custom code (themes, plugins, custom routes)
- Merchants can have their own CI/CD
- Closer to original CF Pages model

**Cons:**
- Slower provisioning (~2-3 min for first build)
- More moving parts (GitHub, Docker, CI)
- Each merchant's code must be kept compatible with the platform

### Recommendation: **Start with Model A**, add Model B for enterprise merchants later.

---

## FlyProvider Implementation

```typescript
// packages/cloud/src/providers/fly.ts

import { ofetch, type $Fetch } from 'ofetch'

const FLY_API_BASE = 'https://api.machines.dev/v1'

export interface FlyConfig {
  apiToken: string
  orgSlug: string    // Fly org that owns all merchant apps
}

export class FlyProvider {
  private client: $Fetch
  private orgSlug: string

  constructor(config: FlyConfig) {
    this.orgSlug = config.orgSlug
    this.client = ofetch.create({
      baseURL: FLY_API_BASE,
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    })
  }

  // --- Apps ---

  async createApp(name: string, options?: {
    region?: string
  }): Promise<{ name: string; org: string }> {
    const response = await this.client<any>('/apps', {
      method: 'POST',
      body: {
        app_name: name,
        org_slug: this.orgSlug,
      },
    })
    return { name: response.name, org: response.organization?.slug }
  }

  async deleteApp(name: string): Promise<void> {
    await this.client(`/apps/${name}`, { method: 'DELETE' })
  }

  async getApp(name: string): Promise<{ name: string; status: string }> {
    return this.client(`/apps/${name}`)
  }

  // --- Machines ---

  async createMachine(appName: string, config: {
    image: string
    region?: string
    size?: string      // 'shared-cpu-1x', 'performance-1x', etc.
    memory?: number    // MB
    env?: Record<string, string>
    autoStop?: boolean
    autoStart?: boolean
    services?: Array<{
      ports: Array<{ port: number; handlers: string[] }>
      internalPort: number
      protocol: string
    }>
  }): Promise<{ id: string; state: string; region: string }> {
    const response = await this.client<any>(`/apps/${appName}/machines`, {
      method: 'POST',
      body: {
        region: config.region ?? 'bah',
        config: {
          image: config.image,
          guest: {
            cpu_kind: config.size?.includes('performance') ? 'performance' : 'shared',
            cpus: 1,
            memory_mb: config.memory ?? 256,
          },
          env: config.env ?? {},
          services: config.services ?? [{
            ports: [
              { port: 80, handlers: ['http'] },
              { port: 443, handlers: ['tls', 'http'] },
            ],
            internal_port: 3000,
            protocol: 'tcp',
          }],
          auto_destroy: false,
          restart: { policy: 'on-failure', max_retries: 3 },
          checks: {
            health: {
              type: 'http',
              port: 3000,
              path: '/api/_health',
              interval: '30s',
              timeout: '5s',
              method: 'GET',
            },
          },
        },
      },
    })
    return { id: response.id, state: response.state, region: response.region }
  }

  async stopMachine(appName: string, machineId: string): Promise<void> {
    await this.client(`/apps/${appName}/machines/${machineId}/stop`, {
      method: 'POST',
    })
  }

  async startMachine(appName: string, machineId: string): Promise<void> {
    await this.client(`/apps/${appName}/machines/${machineId}/start`, {
      method: 'POST',
    })
  }

  async destroyMachine(appName: string, machineId: string): Promise<void> {
    await this.client(`/apps/${appName}/machines/${machineId}`, {
      method: 'DELETE',
      params: { force: true },
    })
  }

  async getMachine(appName: string, machineId: string): Promise<{
    id: string
    state: string  // 'created' | 'starting' | 'started' | 'stopping' | 'stopped' | 'destroying' | 'destroyed'
    region: string
    updatedAt: string
  }> {
    const response = await this.client<any>(
      `/apps/${appName}/machines/${machineId}`,
    )
    return {
      id: response.id,
      state: response.state,
      region: response.region,
      updatedAt: response.updated_at,
    }
  }

  async waitForMachine(appName: string, machineId: string, state = 'started', timeoutMs = 60_000): Promise<void> {
    await this.client(`/apps/${appName}/machines/${machineId}/wait`, {
      params: { state, timeout: Math.floor(timeoutMs / 1000) },
    })
  }

  // --- Secrets ---

  async setSecrets(appName: string, secrets: Record<string, string>): Promise<void> {
    // Fly CLI approach — Machines API doesn't have a direct secrets endpoint
    // Secrets are set via fly CLI or the GraphQL API
    // For programmatic use, set env vars on the Machine config instead
    // or use the flaps secrets API
    await this.client(`/apps/${appName}/secrets`, {
      method: 'POST',
      body: Object.entries(secrets).map(([label, value]) => ({
        label,
        type: 'encrypted',
        value: Buffer.from(value).toString('base64'),
      })),
    })
  }

  async listSecrets(appName: string): Promise<Array<{ label: string; type: string }>> {
    const response = await this.client<any[]>(`/apps/${appName}/secrets`)
    return response.map(s => ({ label: s.label, type: s.type }))
  }

  // --- Certificates (Custom Domains) ---

  async addCertificate(appName: string, hostname: string): Promise<{
    hostname: string
    configured: boolean
    acmeStatus: string
  }> {
    const response = await this.client<any>(`/apps/${appName}/certificates`, {
      method: 'POST',
      body: { hostname },
    })
    return {
      hostname: response.hostname,
      configured: response.configured ?? false,
      acmeStatus: response.acme_alpha_status ?? 'pending',
    }
  }

  async removeCertificate(appName: string, hostname: string): Promise<void> {
    await this.client(`/apps/${appName}/certificates/${hostname}`, {
      method: 'DELETE',
    })
  }

  async getCertificate(appName: string, hostname: string): Promise<{
    hostname: string
    configured: boolean
    acmeStatus: string
    dnsValidation: { target: string; instructions: string }
  }> {
    const response = await this.client<any>(
      `/apps/${appName}/certificates/${hostname}`,
    )
    return {
      hostname: response.hostname,
      configured: response.configured ?? false,
      acmeStatus: response.acme_alpha_status ?? 'pending',
      dnsValidation: {
        target: response.dns_validation_target ?? '',
        instructions: response.dns_validation_instructions ?? '',
      },
    }
  }
}
```

---

## Types Changes

```diff
 // packages/cloud/src/types.ts

-export interface CloudflareConfig {
-  apiToken: string
-  accountId: string
-}
+export interface FlyConfig {
+  apiToken: string
+  orgSlug: string
+}

 export interface CloudEnvironment {
   name: string
   url: string
   dbBranchId: string
   dbConnectionString: string
-  r2Bucket: string
-  kvNamespaceId: string
+  flyAppName: string
+  flyMachineId: string
   gitBranch?: string
   prNumber?: number
 }

 export interface CloudConfig {
-  cloudflare: CloudflareConfig
+  fly: FlyConfig
   neon: NeonConfig
   github?: GitHubConfig
   billing?: BillingConfig
 }
```

---

## Dashboard Schema Changes

Minimal — rename CF columns to Fly columns:

```diff
 // apps/dashboard/server/database/schema.ts
 export const projects = sqliteTable('projects', {
   // ... existing fields unchanged ...

-  cfPagesProjectName: text('cf_pages_project_name'),
-  r2BucketName: text('r2_bucket_name'),
-  kvNamespaceId: text('kv_namespace_id'),
+  flyAppName: text('fly_app_name'),
+  flyMachineId: text('fly_machine_id'),
+  flyRegion: text('fly_region'),

   neonProjectId: text('neon_project_id'),
   neonBranchId: text('neon_branch_id'),
   dbConnectionString: text('db_connection_string'),
 })
```

**Existing tables untouched:** `users`, `deployments`, `envVars`, `domains`

---

## deploy-provisioner.ts Rewrite

```diff
 // Step 1: Create Fly App (was: Create CF Pages project)
-const checkRes = await fetch(`${CF_API_BASE}/accounts/${cfAccountId}/pages/projects/${job.cfProjectName}`)
+const checkRes = await fly.getApp(job.flyAppName).catch(() => null)
 
-if (!pagesExists) {
-  await fetch(`${CF_API_BASE}/accounts/${cfAccountId}/pages/projects`, { method: 'POST', body: { ... } })
+if (!checkRes) {
+  await fly.createApp(job.flyAppName, { region: 'bah' })
 }

 // Step 2: Create Neon DB — UNCHANGED

 // Step 3: Set env vars / secrets
-await fetch(`${CF_API_BASE}/accounts/${cfAccountId}/pages/projects/${job.cfProjectName}`, {
-  method: 'PATCH',
-  body: { deployment_configs: { production: { env_vars: { DATABASE_URL: ... } } } },
-})
+await fly.setSecrets(job.flyAppName, { DATABASE_URL: dbConnectionUri })

 // Step 4: Set GitHub Actions secrets
 await setGitHubActionsSecrets(job.githubToken, repoOwner, repoName, {
-  CLOUDFLARE_API_TOKEN: cfToken,
-  CLOUDFLARE_ACCOUNT_ID: cfAccountId,
-  CF_PAGES_PROJECT_NAME: job.cfProjectName,
+  FLY_API_TOKEN: flyToken,
+  FLY_APP_NAME: job.flyAppName,
 })

 // Step 5: Deploy (new step for shared image model)
+await fly.createMachine(job.flyAppName, {
+  image: 'registry.fly.io/commercejs-storefront:latest',
+  region: 'bah',
+  memory: 256,
+  env: { DATABASE_URL: dbConnectionUri, STORE_NAME: job.projectName },
+})

 // Step 6: Done
-const deployUrl = `https://${job.cfProjectName}.pages.dev`
+const deployUrl = `https://${job.flyAppName}.fly.dev`
```

---

## Cost Analysis (Per-Merchant)

### Fly Machine Costs

| Merchant Size | Machine Config | Always-on Cost | With Auto-Suspend |
|--------------|---------------|---------------|-------------------|
| Starter | shared-cpu-1x, 256MB | $1.94/mo | ~$0.15/mo (storage only when idle) |
| Pro | shared-cpu-1x, 512MB | $2.92/mo | ~$0.15/mo idle |
| Business | shared-cpu-1x, 1GB | $3.89/mo | ~$0.15/mo idle |
| Enterprise | performance-1x, 2GB | $19.80/mo | ~$0.30/mo idle |

### Certificates

| Type | Cost |
|------|------|
| `*.fly.dev` subdomain | Free |
| Custom domain cert | $0.10/mo per hostname |
| Wildcard cert | $1.00/mo |

### At Scale (With Auto-Suspend)

| Merchants | Active Always-On | Mostly Idle | Total Est. |
|-----------|-----------------|-------------|-----------|
| 10 | 3 × $2/mo = $6 | 7 × $0.15 = $1 | **~$7/mo** |
| 50 | 10 × $2/mo = $20 | 40 × $0.15 = $6 | **~$26/mo** |
| 100 | 20 × $2/mo = $40 | 80 × $0.15 = $12 | **~$52/mo** |

**+ Neon:** ~$0–20/mo (scale-to-zero branches → minimal cost for idle merchants)
**+ Custom domains:** $0.10/each → 100 domains = $10/mo

---

## What Stays Completely Unchanged

| Component | Lines | Why |
|-----------|-------|-----|
| `packages/platform/` | ~5000+ | Commerce logic is infra-agnostic |
| `packages/types/` | ~800 | Pure TypeScript interfaces |
| `packages/core/` | ~1000 | `createCommerce()`, event bus |
| `packages/nuxt/` | ~2000 | Composables + server routes |
| `packages/ui/` | ~3000 | Vue components |
| `packages/checkout/` | ~500 | Checkout orchestration |
| All adapters | ~3000 | Salla, Medusa |
| All providers | ~2000 | Payment, delivery, notification |
| `packages/cloud/src/providers/neon.ts` | 181 | NeonProvider — zero changes |
| Dashboard UI (95%) | ~lots | Only swap status badges and deploy URLs |
| GitHub Actions integration | ~200 | Just change which secrets are set |

---

## What Changes

| File | Lines Changed | Type |
|------|--------------|------|
| `packages/cloud/src/providers/fly.ts` | ~200 (new) | NEW — replaces `cloudflare.ts` |
| `packages/cloud/src/types.ts` | ~15 | MODIFY — swap CF config for Fly config |
| `packages/cloud/src/deploy.ts` | ~100 | MODIFY — swap CF calls for Fly calls |
| `apps/dashboard/server/utils/deploy-provisioner.ts` | ~50 | MODIFY — 5 surgical diffs |
| `apps/dashboard/server/database/schema.ts` | ~5 | MODIFY — rename 3 columns |
| `apps/dashboard/nuxt.config.ts` | ~5 | MODIFY — swap CF runtime config keys |
| Dashboard UI (deploy status) | ~30 | MODIFY — swap `pages.dev` URLs for `fly.dev` |
| `.github/workflows/deploy-store.yml` | ~10 | MODIFY — `fly deploy` instead of `wrangler` |
| **Total** | **~415 lines** | |

---

## Migration Steps

| Step | Work | Effort |
|------|-----|--------|
| 1 | Write `FlyProvider` class (from mapping above) | 1 day |
| 2 | Update `types.ts` (swap CF → Fly config) | 30 min |
| 3 | Update `deploy.ts` (swap orchestrator CF calls) | 1 day |
| 4 | Update `deploy-provisioner.ts` (5 surgical diffs) | 2 hrs |
| 5 | Update dashboard schema (3 column renames) | 30 min |
| 6 | Build storefront Docker image + push to Fly registry | 1 day |
| 7 | Update `nuxt.config.ts` runtime config | 30 min |
| 8 | Update GH Actions workflow template | 1 hr |
| 9 | Test: create store → verify Machine + Neon + subdomain | 1 day |
| **Total** | | **~3–4 days** |

---

## Comparison: Provider Swap vs. EaaS Pivot

| Aspect | Provider Swap | EaaS Pivot |
|--------|--------------|------------|
| Architecture change | **Minimal** — swap 1 provider class | **Major** — new middleware, schema, DB model |
| Lines changed | ~415 | ~2000+ |
| Time to implement | ~3–4 days | ~10–13 days |
| Dashboard schema | Rename 3 columns | Complete rewrite (5 tables → 4 new tables) |
| Deploy pipeline | Same shape, different target | Eliminated (shared compute) |
| Merchant isolation | Full (own Machine) | Shared (tenant middleware) |
| Custom merchant code | Yes | No |
| Prisma on Fly | Yes (Node.js runtime) | Yes |
| Background jobs | **CF Queues stay** (dashboard stays on CF) | BullMQ + Redis |
| ORM on platform | Switch to Prisma primary | Switch to Prisma primary |
| Risk | Low (same architecture) | Medium (new multi-tenant patterns) |

---

## Open Questions

| Question | Options | Recommendation |
|----------|---------|---------------|
| Where does the dashboard run? | CF Pages (current) or Fly | **Keep on CF Pages** — simpler, the dashboard itself doesn't hit CF runtime limits. Only storefronts move to Fly. |
| Storefront image: shared or per-merchant? | Shared (Model A) or per-merchant (Model B) | **Start shared**, add per-merchant for enterprise |
| Media storage? | Keep R2 + S3 API | **Keep R2** — works fine from Fly (S3-compatible API) |
| Sessions/cache? | In-memory, Redis, or Neon | **In-memory** (Nuxt built-in) — each Machine is single-tenant |
| Auto-suspend or always-on? | Per merchant plan | Starter = auto-suspend, Pro+ = always-on |
