# Commerce.js Cloud — Next Sprint Plan

> **Goal**: Make Commerce.js Cloud functional — from scaffold to a working deploy pipeline where `commercejs deploy` provisions infrastructure and puts a real store online.

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [x] **Research & Strategy Selection** ✅ Completed
  - Reviewed existing scaffold (`@commercejs/cloud`, `@commercejs/cli`, `apps/dashboard`)
  - Documented current state and gap analysis
  - Selected Option A: CLI-First (Bottom-Up)

* [x] [**T01**: Validate Cloud Providers](tasks/T01.md) - Status: ✅ Completed
* [x] [**T02**: Build Pipeline in DeployOrchestrator](tasks/T02.md) - Status: ✅ Completed
* [x] [**T03**: CLI Deploy End-to-End](tasks/T03.md) - Status: ✅ Completed
* [x] [**T04**: Dashboard Project Persistence](tasks/T04.md) - Status: ✅ Completed
* [x] [**T05**: Dashboard Deploy Integration](tasks/T05.md) - Status: ✅ Completed

<!-- END PROGRESS SECTION -->

---

## Research & Strategy Selection
**Status**: ✅ **Completed**

### Goal
Get Commerce.js Cloud from its current scaffold state to a **functional deploy pipeline** — where a developer (or the dashboard) can deploy a Commerce.js storefront to Cloudflare with a Neon database, and have it work.

### Context

**What already exists (scaffold — well-typed, not tested):**

| Component | State | Details |
|---|---|---|
| `CloudflareProvider` | Structural | Pages, R2, KV, custom domains via Cloudflare REST API. Deploy uses direct upload (needs build output). |
| `NeonProvider` | Structural | Project CRUD, branch management, connection strings. |
| `GitHubProvider` | Structural | Webhook install, PR detection, repo info, event parsing. |
| `BillingProvider` | Structural | Dual-provider (Tap GCC + Stripe intl), subscriptions, checkout sessions. |
| `DeployOrchestrator` | Structural | Provisions DB + R2 + KV → deploys to Pages. Missing: git clone, build step, migrations, env var injection. |
| `WebhookHandler` | Structural | Processes GitHub push/PR events → triggers deploy/preview. |
| `PreviewManager` | Structural | Creates/destroys preview environments per PR. |
| CLI `deploy` | Structural | Calls `DeployOrchestrator.deploy()`. Missing: `loadCloudConfig()` implementation details. |
| CLI `init` | Structural | Scaffolds project. Uses `giget`. |
| CLI `env` | Structural | Env var management. |
| Dashboard | Structural | 23 pages (login, projects, billing, store mgmt, settings, profile). Server API focused on Armada OAuth + admin auth. **No project CRUD, no deploy API, no billing backend.** |

**Key architectural decisions already made:**
- Cloudflare Pages for compute (Nitro preset `cloudflare-pages`)
- Neon Postgres for tenants (branch-per-PR for previews)
- NuxtHub for dashboard backend (D1 for dashboard's own DB, R2 for assets, KV for sessions)
- Dual billing: Tap (GCC) + Stripe (international)
- GitHub App for push-to-deploy

**What's missing to make it work:**
1. **Build pipeline** — clone repo → install deps → run migrations → nuxt build → upload output
2. **Project CRUD** — dashboard server routes to create/read/update/delete Cloud projects (stored in NuxtHub D1)
3. **Deploy triggering** — dashboard triggers deploy via `DeployOrchestrator`; webhook triggers auto-deploy
4. **Env var management** — store encrypted env vars per project, inject during build
5. **Cloud provider tests** — zero tests exist; need at least integration tests for each provider
6. **Dashboard ↔ Cloud wiring** — dashboard server calls `@commercejs/cloud` providers to orchestrate

### Key Findings

1. **The deploy orchestrator skips the build step** — it provisions infra and calls `deployPages(projectName, './output')` but never clones, installs, or builds. This is the biggest gap.

2. **Dashboard has no project persistence** — NuxtHub D1 is configured but no tables/schema for Cloud projects. Server API routes are only for Armada and admin auth.

3. **The scaffold architecture is sound** — Provider pattern, separation of concerns, type safety. The code structure follows the same patterns as the commerce providers.

4. **Cloudflare Pages Direct Upload** is the right strategy — it avoids needing GitHub integration for the initial version. The CLI/dashboard builds locally (or in a worker) and uploads the output directory.

5. **NuxtHub's D1 for dashboard persistence** is a good fit — the dashboard is already configured with `hub.database: true`. We can use Drizzle with D1 for project/deployment/user tables.

### Strategy Proposals

---

#### Option A: CLI-First (Bottom-Up)

**Description:** Focus on making `commercejs deploy` work end-to-end from the terminal. Validate the Cloud providers against real APIs. Dashboard integration comes after the CLI works.

**Sprint scope:**
1. Write integration tests for CloudflareProvider + NeonProvider (against real accounts, gated behind env vars)
2. Implement the missing build pipeline in `DeployOrchestrator` (clone → install → migrate → build → upload)
3. Make `commercejs deploy` work with the storefront — deploy `apps/storefront` to Cloudflare Pages with Neon Postgres
4. Functional smoke test: `commercejs deploy` → store is live at `*.pages.dev`
5. (If time allows) Add project persistence to dashboard D1

**Pros:**
- Validates the entire stack bottom-up — if the CLI works, the dashboard just needs to call the same APIs
- Faster to ship — no UI work needed
- Easier to test and debug — terminal gives immediate feedback
- Proves the architecture before building UI around it

**Cons:**
- Merchants can't self-serve yet — requires CLI access
- Dashboard remains non-functional longer
- No project persistence until dashboard work happens

**Estimated effort:** 1-2 weeks

---

#### Option B: Dashboard-First (Top-Down)

**Description:** Focus on the dashboard — add project CRUD, deploy triggering, and basic billing. CLI wraps the same backend APIs. Visual flow: `Create project in dashboard → Deploy → See it live`.

**Sprint scope:**
1. Design D1 schema for Cloud projects (projects, deployments, env_vars, users)
2. Server API routes: `POST /api/projects`, `POST /api/projects/:id/deploy`, `GET /api/projects/:id/deployments`
3. Wire dashboard pages to server API (project list, project detail, deploy button)
4. Dashboard triggers `DeployOrchestrator` server-side
5. Add GitHub OAuth for dashboard login
6. CLI `deploy` command calls the dashboard API (same backend)

**Pros:**
- Merchant-facing from day one — visual UX
- Project persistence from the start
- Can demo to stakeholders with a UI
- Natural user flow: create → configure → deploy → monitor

**Cons:**
- More work before first functional deploy (need schema + API + UI)
- Higher blast radius — dashboard, schema, API, multi-tenant all at once
- Harder to debug when something fails (is it the UI, API, or orchestrator?)

**Estimated effort:** 2-3 weeks

---

#### Recommendation

**Option A (CLI-First)** is recommended because:
1. It validates the infrastructure code against real APIs first — crucial for confidence
2. The CLI deploy command is already scaffolded and close to working
3. Once CLI works, dashboard becomes "just a UI" for the same proven orchestration
4. Lower risk — single-concern focus, easier testing, faster time-to-first-deploy

The dashboard can follow immediately after as a thin wrapper around the proven orchestration layer.

### Selected Approach

**Decision**: Option A — CLI-First (Bottom-Up)

**Rationale**: Validates infrastructure code against real APIs first. The CLI deploy command is already scaffolded and close to working. Once CLI works, the dashboard becomes "just a UI" for the same proven orchestration. Lower risk — single-concern focus, easier testing.

**Key Findings:**
- Deploy orchestrator skips the build step — provisions infra then calls `deployPages` with no build output
- Dashboard has no project persistence (no D1 tables)
- All provider code is well-typed `ofetch` wrappers, ready for real API calls
- Neon is already at v1.0.2, Cloudflare Pages Direct Upload is the right strategy

**Implementation Plan:**
1. Validate Cloud providers against real Cloudflare + Neon APIs (T01)
2. Implement build pipeline in DeployOrchestrator: clone → install → migrate → build → upload (T02)
3. Make `commercejs deploy` work end-to-end with `apps/storefront` (T03)
4. Add project persistence to dashboard via D1 + Drizzle (T04)
5. Wire dashboard deploy button to the proven orchestrator (T05)
- Cloudflare account with API token (Pages, R2, KV permissions)
- Neon account with API key
- The existing `apps/storefront` as the test deployment target

### Related Files
- `packages/cloud/src/` — All provider implementations
- `packages/cli/src/commands/deploy.ts` — Deploy command
- `apps/dashboard/` — Dashboard app (Nuxt 4 + NuxtHub)
- `packages/platform/` — Platform adapter (needs Neon connection for deployed stores)

---

## Implementation Tasks

> Task files will be created in `.plans/phase-7-cloud/tasks/` after approach is selected.

---

## Lessons Learned (Post-Implementation)

### What Went Well
- [TBD]

### What Could Be Improved
- [TBD]

---

<!-- META_INFORMATION -->
## Task Status Legend
- 🔴 **Blocked**: Requires external dependency or decision
- 🟡 **Planned**: Ready to implement
- 🟢 **In Progress**: Currently being worked on
- ✅ **Completed**: Done

## Change Log

- **2026-02-26**: Initial sprint plan — research complete, 2 approaches proposed
<!-- META_INFORMATION -->
