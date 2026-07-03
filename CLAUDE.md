# CommerceJS — Claude Context

> This project runs the **Agentic Workflow** — see `docs/WORKFLOW.md` (protocol +
> project profile §10). Owner status page: `docs/product/overview.html`.

## Session Start (Every Conversation — No Exceptions)

Before doing anything else — before answering questions, before writing code:

```
1. Read .plans/grand-plan.md               ← ENTRY POINT — vision, architecture, current phase
2. Read .memory/checkpoint.md              ← latest session state, immediate next task
3. Read .agent/skills/commercejs/SKILL.md  ← build chain, branch rules, EaaS architecture
4. Check current branch: git branch --show-current
```

Then follow `.agent/rules/operating-protocol.md` for everything that follows.

---

## What This Project Is

**CommerceJS** is a modular, provider-agnostic eCommerce toolkit for JavaScript/TypeScript. The core insight: every eCommerce platform (Salla, Shopify, Medusa, WooCommerce) speaks a different language. CommerceJS maps them all to a single unified API via an adapter pattern.

It has two distinct product layers:
1. **Open-source SDK** — 17 published npm packages (`@commercejs/*`) covering types, adapters, checkout engine, payments, delivery, notifications, analytics, storage, and a Nuxt module
2. **CommerceJS Cloud (EaaS)** — A multi-tenant eCommerce-as-a-Service platform (think Salla/Shopify, not Vercel). Merchants sign up, get a storefront + admin + API + dedicated database, and start selling

---

## Active Direction: Fly.io EaaS

> **The project is pivoting from Cloudflare to Fly.io.** Do not suggest Cloudflare-specific solutions.

The `main` branch is still on Cloudflare Pages. Active development is moving to a new `fly/eaas` branch (not yet created — this is the next task). The full migration plan is at `.plans/fly-migration-plan.md`.

**Why the pivot:** Cloudflare's runtime has hard constraints that blocked progress — 50 subrequest limit, WASM-only Prisma, no standard Node.js APIs, D1/SQLite limitations. Fly.io runs standard Node.js with no such constraints.

**The EaaS architecture (Fly.io):**
- Shared compute (one Fly.io deployment for all merchants)
- Dedicated Neon Postgres DB per merchant (branch per merchant, project per large merchant)
- Tenant middleware resolves merchant from subdomain/API key/custom domain
- BullMQ + Upstash Redis for background jobs (replaces CF Queues)
- Prisma as primary ORM (no Drizzle on `fly/eaas`)

---

## Monorepo Structure

```
packages/           # Published npm packages (@commercejs/*)
  types/            # Unified data model — 26+ domain types, 18+ sub-interfaces
  core/             # createCommerce(), EventBus, WebhookDispatcher, Orchestrator
  checkout/         # Channel-agnostic checkout state machine
  platform/         # Built-in commerce engine (Drizzle + Prisma, Neon Postgres)
  nuxt/             # Nuxt module — 16 composables, 46 REST routes, Zod validation
  ui/               # eCommerce UI components (33 components, Nuxt UI v4)
  adapter-salla/    # Salla platform adapter (9 domains)
  adapter-medusa/   # Medusa V2 adapter (7 domains, 44 contract tests)
  payment-tap/      # Tap Payments provider
  delivery-armada/  # Armada last-mile delivery
  delivery-parcel/  # Parcel delivery (OAuth2)
  webhook-verifier/ # HMAC webhook verification
  notification-resend/
  notification-smtp/
  analytics-ga/
  storage-s3/
  cloud/            # CF infra orchestration — DO NOT USE on fly/eaas branch
  cli/              # commercejs deploy/init/env commands

apps/               # Private applications
  storefront/       # Reference Nuxt 3 storefront
  hosted-checkout/  # Deployable checkout (Tap card elements, payment links, QR)
  dashboard/        # Cloud platform dashboard (Nuxt 4)
  docs/             # Documentation site (commerce.js.org)

.memory/            # Cross-session knowledge base — READ THIS
.plans/             # Implementation plans — READ RELEVANT PLAN BEFORE STARTING
.research/          # Strategic research documents
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Package manager | pnpm 9.15.4 |
| Monorepo | Turborepo 2.x |
| Language | TypeScript 5.7 (strict) |
| Testing | Vitest 4.x |
| Versioning | Changesets |
| Framework | Nuxt 3/4 (Vue 3) |
| ORM (fly/eaas) | **Prisma 7.6+ (primary)** |
| ORM (main/CF) | Drizzle (primary), Prisma (parity) |
| Database | Neon Postgres |
| Hosting | Fly.io (fly/eaas), Cloudflare Pages (main) |
| UI | Nuxt UI v4, Tailwind CSS v4 |
| Job queue | BullMQ + Upstash Redis (fly/eaas) |

---

## Commands

```bash
# Development
pnpm dev                                    # Run all apps in dev mode
pnpm --filter <package> dev                 # Run a specific package/app

# Building
pnpm build                                  # Build everything (turbo)
pnpm --filter @commercejs/platform build    # Build a specific package

# Testing
pnpm test                                   # Run all tests
pnpm test:watch                             # Watch mode
pnpm --filter <package> test               # Test a specific package

# Type checking
pnpm typecheck                              # Type-check everything

# Prisma (fly/eaas branch)
cd packages/platform && npx prisma generate             # Regenerate client
cd packages/platform && npx prisma migrate dev          # Dev migration
cd apps/dashboard && npx prisma generate                # Control DB client
cd apps/dashboard && npx prisma migrate deploy          # Deploy control DB migrations

# Query parity check (main branch only)
bash packages/platform/scripts/check-query-parity.sh

# Publishing
pnpm release                                # Create a changeset
```

---

## Architecture Patterns

Adapters map platform-specific APIs to a unified `createCommerce()` interface. Domains = CRUD data sources (catalog, cart, orders). Providers = event-driven side effects (payments, delivery, notifications). Three domain tiers: Universal (catalog, store), Common (cart, checkout, orders, customers), Specialized (wholesale, subscriptions). Full patterns with code examples: `.agent/skills/commercejs/SKILL.md`.

**fly/eaas two-DB model:** Control DB (singleton Prisma, merchants/api_keys/domains) + Merchant DB (cached Prisma per tenant, commerce data). Tenant resolved from subdomain → API key → custom domain → control DB lookup → `merchant.database_url`.

---

## Locked Decisions

These are final. Do not revisit without explicit instruction.

### On fly/eaas branch
- **Prisma is the primary ORM.** No Drizzle on fly/eaas. Both control DB and merchant DBs use Prisma.
- **`packages/cloud/` is untouched.** New provisioning logic lives in `apps/dashboard/server/utils/merchant-provisioner.ts`. Do not import from `@commercejs/cloud` on the fly/eaas branch.
- **BullMQ + Upstash Redis for jobs.** CF Queues (`nitro._queue`) are CF-only. `worker.ts` is a standalone Fly process.
- **Nitro preset is `node-server`.** Never `cloudflare-pages` on fly/eaas.
- **No `@nuxthub/core`.** D1, KV, and Blob are Cloudflare-only. Remove from dashboard on fly/eaas.
- **Two databases, two Prisma clients.** Control DB = singleton. Merchant DB = cached per-merchant client.
- **Fly.io region: `bah` (Bahrain).** Primary market is GCC/MENA.

### On main branch (Cloudflare)
- **Migrations run at build time, not runtime.** Never call `migrateDrizzle()` from server plugins or request handlers.
- **Drizzle + Neon HTTP for platform, D1 + Drizzle for dashboard.** No separate DB service.
- **Drizzle and Prisma stay at parity.** When adding a Drizzle query, always add the Prisma equivalent. Run `check-query-parity.sh` after changes.
- **Cart composable must auto-create and auto-recover.** Never throw "No cart ID". Retry once on stale cookie (404/500).
- **Delivery dispatch is a separate admin action.** `POST /api/delivery-dispatch`. Optional `autoDispatch: true` in CommerceConfig.

### Universal
- **Neon branch operations need retry-with-backoff.** Neon returns 423 Locked for ~3s after project creation. Always retry (2s base, 5 retries).
- **Profile** is the cross-merchant buyer identity type. Not `CustomerProfile`. DB tables: `profiles`, `profile_addresses`, etc.
- **`@commercejs/cloud` must be rebuilt before CLI picks up changes.** `pnpm --filter @commercejs/cloud build` first.

---

## Critical Gotchas (Cloudflare — main branch)

Full details: `.memory/gotchas.md`. TL;DR: 50 subrequest limit, `addServerScanDir` silent failures, no Vue auto-imports in `node_modules` SSR (always explicit-import in `@commercejs/ui`), `NUXT_SESSION_PASSWORD` required in prod. None of these apply on Fly.io.

## Prisma Setup (fly/eaas)

Full setup: `.agent/skills/commercejs/SKILL.md` → Prisma Setup section. TL;DR: version 7.6.0, `runtime = "node"` (not `"cloudflare"`), add `@prisma/adapter-neon: "^7.6.0"` to `packages/platform/package.json`.

---

## Agent System

The `.agent/` directory contains the full operating protocol for Claude sessions. **Follow it on every task.**

```
.agent/rules/operating-protocol.md     # How to work — load context, execute, validate, checkpoint
.agent/rules/meta-cognitive-protocol.md # How to think — ORIENT, THINK, EXECUTE, CORRECT, DELIVER
.agent/rules/ci-monitor-protocol.md    # Read after every git push — monitor CI until green (lazy-load)

.agent/workflows/init.md               # /init — load context at conversation start
.agent/workflows/dev.md                # /dev — phase-based feature work and commits
.agent/workflows/scaffold-package.md   # /scaffold-package — create a new @commercejs/* package
.agent/workflows/publish.md            # /publish — publish packages to npm via changesets

.agent/skills/commercejs/SKILL.md      # Project bible — build chain, packages, EaaS architecture
.agent/skills/nuxt-modules/SKILL.md    # Creating Nuxt modules
.agent/skills/vueuse-functions/SKILL.md # VueUse composables reference
```

## Memory & Planning System

**Always check before starting work:**

```
.memory/decisions.md    # 15 locked decisions — rules that must be followed
.memory/gotchas.md      # Hard-won CF Workers bugs and fixes
.memory/preferences.md  # Coding style and workflow preferences
.memory/checkpoints/    # Session checkpoints — what was done and when
.memory/checkpoint.md   # Latest session state

.plans/grand-plan.md               # ENTRY POINT — read first every session
.plans/roadmap.md                  # Master roadmap (7 phases)
.plans/fly-migration-plan.md       # LOCKED DOWN — Fly.io EaaS implementation
.plans/merchant-admin/plan.md      # Current gate — merchant-facing admin UI
.plans/storefront-eaas/plan.md     # Shipped — hosted Nuxt storefront on Fly
.plans/provider-swap-flyio.md      # Alternative: provider swap only
.plans/post-mortem-eaas-pivot.md   # Contingency: EaaS multi-tenant blueprint
.plans/post-mortem-backup-plan.md  # Contingency: if Cloud vision stalls
```

**Workflow rules:**
- **Read `.plans/grand-plan.md` first** — mandatory at session start; it points to the current gate, phase status, and every other doc
- Update `.plans/` in the same commit as the work — never defer
- Write session checkpoints to `.memory/checkpoints/` with timestamp
- When making an architectural decision, add it to `.memory/decisions.md`
- When discovering a new gotcha, add it to `.memory/gotchas.md`
- When a phase-level milestone closes (a `.plans/*/plan.md` flips to ✅, current gate changes, new deployment added), bump `.plans/grand-plan.md` in the same commit

---

## Publishing Packages

This monorepo uses [Changesets](https://github.com/changesets/changesets) for versioning.

```bash
pnpm release           # Create a changeset (describe what changed)
# CI handles npm publish on merge to main via .github/workflows/release.yml
```

All packages under `packages/` are published to npm as `@commercejs/*`. Apps under `apps/` are private.

---

## What NOT to Do

- **Don't suggest Cloudflare solutions on fly/eaas branch.** No wrangler, no D1, no KV, no CF Pages, no CF Queues.
- **Don't delete Drizzle from `packages/platform/`.** It stays for the `main` branch.
- **Don't call `migrateDrizzle()` at runtime** (main branch). Build-time only.
- **Don't add inline provisioning to request handlers.** Background jobs via BullMQ only (fly/eaas).
- **Don't create a shared DB for merchants.** Every merchant gets their own Neon branch. No `merchant_id` columns + RLS — that's the architecture we explicitly rejected.
- **Don't import from `@commercejs/cloud` on fly/eaas.** New provisioning is in `dashboard/server/utils/`.
- **Don't skip `check-query-parity.sh`** when modifying platform domain queries on `main`.
