# Checkpoint

## Current Phase

**Fly.io EaaS Migration — Not Yet Started**

The project has completed Phases 1–5 and the Phase 7 CF infrastructure sprint. A strategic decision has been made to pivot away from Cloudflare and rebuild the Cloud platform on Fly.io as a true multi-tenant EaaS (like Salla/Shopify). The `fly/eaas` branch does not exist yet — **creating it is the immediate next task.**

## Strategic Context

- **Goal**: EaaS platform (merchant signs up → gets storefront + admin + API + dedicated DB) AND open-source SDK recognition (like Medusa)
- **Why Fly.io**: CF Workers hit hard limits — 50 subrequest cap, WASM-only Prisma, no standard Node.js. Fly.io = standard Node.js, no constraints.
- **OSS story**: Depends on the platform running on plain Node.js first. Ship Fly.io EaaS → then open-source story becomes credible.
- **Market**: MENA-first (Bahrain region, Arabic RTL, Tap/stcpay/Mada/Tabby/Tamara). No Western competitor owns this stack.

## Current Codebase State (main branch)

| Item | State |
|------|-------|
| `fly/eaas` branch | ❌ Does not exist yet |
| Prisma version | 7.4.0 — needs upgrade to 7.6.0 |
| `runtime` in schema.prisma | `"cloudflare"` — must change to `"node"` |
| `@prisma/adapter-neon` | Missing from `packages/platform/package.json` |
| `apps/dashboard` preset | `cloudflare-pages` — must change to `node-server` |
| `@nuxthub/core` in dashboard | Present — must be removed on `fly/eaas` |
| Dockerfile | Does not exist |
| fly.toml | Does not exist |
| Tenant middleware | Does not exist |
| BullMQ worker | Does not exist |
| Merchant provisioner | Does not exist |
| CLAUDE.md | ✅ Created — comprehensive project context |
| `.agent/` system | ✅ Rules, workflows, skills all in place |

## What Was Done This Session (2026-04-14)

- Created `CLAUDE.md` at monorepo root — full project context, branch rules, locked decisions, gotchas, Prisma setup, agent system map
- Updated `.agent/skills/commercejs/SKILL.md` — added Active Branch Context table, **Autonomous Decision Rules** (when to decide vs. pause), fixed platform/apps descriptions, added storage-s3, added EaaS Architecture section, fixed Prisma anti-patterns to be branch-aware, **compressed Package Taxonomy** (CLAUDE.md is now source of truth for package list)
- Trimmed `.agent/rules/operating-protocol.md` — replaced 35-line dead skill table with 12-line accurate skill table, **extracted Checkpoint Procedure to `.agent/rules/checkpointing.md`**
- Created `.agent/rules/checkpointing.md` — checkpoint procedure extracted for lazy loading
- Made `ci-monitor-protocol.md` **lazy-loaded** (removed `always_on` trigger — only needed after git push)
- Progressive disclosure applied: CLAUDE.md ~90 lines saved (Architecture Patterns, Critical Gotchas, Prisma Setup → pointers); SKILL.md ~40 lines saved (Package Taxonomy condensed)
- Fixed dead references in `meta-cognitive-protocol.md`, `scaffold-package.md`, `dev.md`
- Evaluated all plans, research, and strategy documents

## Immediate Next Steps

### Step 1: Pre-migration fixes on `main` (do first, ~30 min)
1. Bump Prisma to 7.6.0 across all package.json files
2. Add `@prisma/adapter-neon: "^7.6.0"` to `packages/platform/package.json`
3. Change `runtime = "cloudflare"` → `runtime = "node"` in `packages/platform/src/database/prisma/schema/schema.prisma`
4. Run `cd packages/platform && npx prisma generate` to verify
5. Commit: `chore: upgrade prisma to 7.6.0, fix runtime for fly/eaas`

### Step 2: Create fly/eaas branch and execute migration plan
Full plan at `.plans/fly-migration-plan.md` — 9 steps, ~13 days to agency MVP.

Critical path:
- Day 1: `git checkout -b fly/eaas` → change nuxt.config preset → add Dockerfile + fly.toml
- Days 2–3: Dashboard control DB (Prisma schema for Merchant, ApiKey, Domain, DashboardUser)
- Day 4: Platform switches to `initPrisma()` instead of `initDrizzle()`
- Day 5: Tenant middleware (subdomain/API key resolution, LRU cache)
- Day 6: BullMQ worker.ts (provision-store, send-email, dispatch-webhook)
- Days 7–8: Merchant provisioner (Neon branch creation + migrations)
- Days 9–12: Dashboard UI refactor (merchants instead of projects, email/password auth)
- Day 13: `fly deploy` to Bahrain region

## Key Files to Know

| File | Purpose |
|------|---------|
| `.plans/fly-migration-plan.md` | LOCKED DOWN — complete step-by-step migration |
| `.plans/roadmap.md` | Master roadmap — phases 1–7 |
| `.memory/decisions.md` | 15 locked architectural decisions |
| `.memory/gotchas.md` | CF Workers bugs (context for why we're leaving) |
| `packages/platform/src/database/prisma/schema/schema.prisma` | Change runtime here |
| `apps/dashboard/nuxt.config.ts` | Change preset here |
| `apps/dashboard/server/utils/db.ts` | Rewrite from D1/Drizzle to Prisma/Neon |
