# CommerceJS — Grand Plan

> The single source of truth for session orientation. Read this first, always.

---

> **Context**: This file is the mandatory-first-read at the start of every new Claude session. It exists to stop the pattern of rediscovering vision + architecture + current phase state from scratch by piecing together 8+ scattered planning docs. Its scope is deliberately narrow — **orientation, not execution detail.** If this file contradicts a more specific plan (roadmap, phase plan, checkpoint), **the specific plan wins.** Grand-plan is phase-granular; everything else is session-granular or task-granular.

## 30-Second Pitch

- **What** — CommerceJS is a modular eCommerce SDK (17 `@commercejs/*` npm packages) **plus** a multi-tenant eCommerce-as-a-Service platform (CommerceJS Cloud) running on Fly.io.
- **Who for** — MENA-first merchants who want a hosted stack in 60s, and OSS developers self-hosting the SDK against their own infrastructure. Same codebase, two deployment paths.
- **Why** — Every eCommerce platform (Salla, Shopify, Medusa, Woo) speaks a different language. CommerceJS is a composable **orchestrator**, not a monolithic adapter. Data domains and side-effect providers compose independently; the native `@commercejs/platform` engine fills gaps that upstream adapters don't cover.

## The Three Pillars

| Pillar | Vision | Primary surface | Status |
|---|---|---|---|
| **☁️ Cloud** | "Vercel for Commerce" — provision a merchant stack in ~60s | `app.commercejs.cloud` + async provisioning pipeline | 🟢 |
| **🛍️ Store** | Premium hosted Nuxt storefront, conversion-optimized, MENA-aware | `*.commercejs.cloud` (SSR) + `@commercejs/ui` components | 🟢 |
| **💳 Checkout** | Universal channel-agnostic state machine — web, mobile, POS QR, AI agent payment links | `checkout.commercejs.cloud` + `@commercejs/checkout` SDK | 🟢 |

Full vision → [`.research/best-ecommerce-strategy.md`](../.research/best-ecommerce-strategy.md).

> **Pillars vs phases.** Pillars are product-shape framing; phases are delivery framing. They overlap but are not 1:1 — e.g. Phase 7 covers Pillar 1 Cloud almost entirely, most of Pillar 2 Store, and ships the hosted-checkout surface for Pillar 3. Use pillars to explain *what we sell*; use phases to track *what we're building*.

## Architecture at a Glance

- **Two product layers** — 17 published `@commercejs/*` packages (types, core, nuxt module, platform engine, adapters, providers) **+** `commercejs-cloud` multi-tenant EaaS.
- **Two-DB model** — control DB (singleton Prisma client; `merchants`, `api_keys`, `domains`, `dashboard_users`) **+** per-merchant DB (cached Prisma client per tenant; commerce data on a dedicated Neon branch).
- **Tenant resolution** — subdomain → `X-Commerce-Key` header → custom domain, LRU-cached, with a `registerEventResolver()` per-event binding pattern that scales under concurrent multi-tenant traffic.
- **Three co-supervised Fly processes** per web machine — dashboard `:3000`, storefront `:3001`, hosted-checkout `:3002` — orchestrated by `scripts/start-web.sh` with hostname-routing middleware.
- **Async work** — BullMQ + Upstash Redis standalone worker process (`worker.ts`) handles Neon provisioning, webhook dispatch, and (soon) transactional email.

Full patterns → [`.agent/skills/commercejs/SKILL.md`](../.agent/skills/commercejs/SKILL.md). Locked architectural decisions → [`.memory/decisions.md`](../.memory/decisions.md).

---

<!-- PROGRESS SECTION -->

## Phase Status

| Phase | Status | Summary |
|---|---|---|
| 1 — Prove the Contract | ✅ | `@commercejs/types`, Salla adapter, 258 contract tests |
| 1b — Reference Storefront | ✅ | 9-page Nuxt storefront in `apps/storefront` |
| 2 — SDK Quality & DX | ✅ | Zod (18 schemas), `defineCommerceHandler`, ULID request context |
| 3 — Architecture Evolution | ✅ | Three-tier orchestrator, composite + fallback factories, notification/analytics/tax providers |
| 4 — Universal Checkout + Medusa | ✅ | Channel-agnostic state machine, payment links, QR, Medusa adapter (44 tests) |
| 5 — Dev Tools | ✅ | OpenAPI at `/_openapi.json`, Scalar UI at `/_scalar` |
| 6 — Future Vision | 🔲 | MCP server, loyalty, subscriptions, search — backlog, see [`roadmap.md`](roadmap.md) |
| **7 — CommerceJS Cloud (EaaS)** | 🟡 | **In flight** — see workstreams below |

### Phase 7 workstreams

| Workstream | Status | Plan |
|---|---|---|
| Fly.io infrastructure (Steps 1–8) | ✅ | [`fly-migration-plan.md`](fly-migration-plan.md) |
| Operator dashboard (merchants CRUD, async provisioning, danger-zone delete) | ✅ | `apps/dashboard/` |
| Storefront EaaS (T01 API routes + T02 remote mode + T03 node-server + T04 hosted SSR + composable rewrite) | ✅ | [`storefront-eaas/plan.md`](storefront-eaas/plan.md) |
| Hosted checkout card payments (Tap SDK + COD, co-supervised on `:3002`) | ✅ | `apps/hosted-checkout/` |
| **Merchant admin UI (T01–T05)** | 🟡 | [`merchant-admin/plan.md`](merchant-admin/plan.md) ← **current gate** (T01 ✅; T02 next) |
| Tap subscription billing (merchant SaaS plan charges) | 🔲 | No plan doc yet; `Merchant.tapCustomerId` column plumbed |
| Transactional emails (order confirmations, password resets, trial-ending) | 🔲 | No plan doc yet; `handleSendEmail` stub in `worker.ts` |

<!-- END PROGRESS SECTION -->

## 🎯 What's Next

**The gate.** Merchants can sign up and get provisioned, the storefront renders, the checkout takes cards and COD — but merchants have no way to populate their catalog or view orders. Merchant-admin **T01 (auth foundation) shipped 2026-04-17**: `cjs-merchant-session` cookie util, `/api/admin/auth/{login,logout,session}` routes, first-login bootstrap from the `Merchant` row, `/api/admin` removed from `SKIP_PREFIXES`. Next up: **T02 (admin shell in `apps/storefront`)** — protected `/admin` layout that redirects unauthenticated to `/admin/login` and shows a dashboard landing for authed. Detail → [`merchant-admin/plan.md`](merchant-admin/plan.md).

**Parallel (non-blocking) track.** Migrate the dashboard's tenant middleware from the legacy `bindDb()` + `initPrisma()` fallback to the per-event `registerEventResolver()` + `useEvent()` pattern that `apps/hosted-checkout` now uses. Race-prone under concurrent different-merchant traffic; currently masked because the smoke tenant is the only one in play. Must land before the merchant admin UI sees multi-merchant production traffic. Detail → the latest checkpoint's "Carry-Overs" section.

## Live Deployments

| Host | Purpose | Code | Health |
|---|---|---|---|
| `app.commercejs.cloud` | Operator dashboard (login, merchants CRUD, provisioning UI) | `apps/dashboard/` on `:3000` | `/api/_health` |
| `*.commercejs.cloud` | Hosted merchant storefront (SSR, per-tenant DB binding, `/_storefront/*` assets) | `apps/storefront/` on `:3001` | — |
| `checkout.commercejs.cloud` | Hosted card-payment app (Tap SDK, payment links, `/_checkout/*` assets) | `apps/hosted-checkout/` on `:3002` | — |
| `commercejs-cloud.fly.dev` | Fly edge for the whole stack (all 3 processes co-supervised by `scripts/start-web.sh`) | `fly.toml` + `Dockerfile` | `/api/_health` |

Fly region: `fra` (Frankfurt). IPv4: `149.248.222.30` (dedicated). IPv6: `2a09:8280:1::102:787c:1`. DNS: apex + wildcard A/AAAA, plus `_acme-challenge` CNAME for the wildcard cert.

## State Snapshot

```
─────────────────────────────────────────────────────────
  State Snapshot · 2026-04-17
─────────────────────────────────────────────────────────
  Active branch:         fly/eaas
  Latest checkpoint:     .memory/checkpoints/2026-04-17T1800.md
  Last major milestone:  Merchant-admin T01 (auth foundation)
                         shipped — /api/admin/auth/{login,
                         logout,session} live on Fly, three
                         acceptance curls green
  Current blocker:       T02 — admin shell in apps/storefront
                         (protected /admin layout wired to the
                         cjs-merchant-session cookie)
  Open carry-overs:      Dashboard still on bindDb()+_db fallback
                         (pending per-event migration — now
                         carries /api/admin/* traffic too).
                         NUXT_* prefix gotcha has bitten 3× —
                         keep near the top of .memory/gotchas.md.
  Last updated:          2026-04-17
─────────────────────────────────────────────────────────
```

> **Staleness signal.** This snapshot is dated. If you see this block more than ~14 days old without a matching entry in `.memory/checkpoint.md`, treat it as suspect and reconcile against checkpoint before trusting it.

## Where to Look

| Question | File |
|---|---|
| Project orientation + current phase (this doc) | [`grand-plan.md`](grand-plan.md) |
| Latest session state + carry-overs | [`.memory/checkpoint.md`](../.memory/checkpoint.md) |
| Locked architectural decisions | [`.memory/decisions.md`](../.memory/decisions.md) |
| Hard-won bugs (`NUXT_*` prefix, CF limits, etc.) | [`.memory/gotchas.md`](../.memory/gotchas.md) |
| Master 7-phase roadmap + change log | [`roadmap.md`](roadmap.md) |
| Fly.io infrastructure plan (Steps 1–8, LOCKED) | [`fly-migration-plan.md`](fly-migration-plan.md) |
| Current gate — merchant admin UI (T01–T05) | [`merchant-admin/plan.md`](merchant-admin/plan.md) |
| Storefront EaaS architecture + lessons | [`storefront-eaas/plan.md`](storefront-eaas/plan.md) |
| Product vision (three pillars) | [`../.research/best-ecommerce-strategy.md`](../.research/best-ecommerce-strategy.md) |
| Multi-tenancy architecture research | [`../.research/cloud-architecture.md`](../.research/cloud-architecture.md) |
| Build chain, package map, agent protocol | [`../.agent/skills/commercejs/SKILL.md`](../.agent/skills/commercejs/SKILL.md) |
| Project-wide Claude instructions | [`../CLAUDE.md`](../CLAUDE.md) |

## Emoji Legend

- ✅ — done / shipped
- 🟢 — in progress (active work)
- 🟡 — planned or partially done
- 🔴 — blocked (needs external input or decision)
- 🔲 — backlog (not started, not yet scheduled)

## How This File Stays Current

1. **When to update** — in the SAME commit that flips a `.plans/*/plan.md` from 🟢 → ✅, creates a new plan doc, changes the current gate, adds a live deployment, or locks/unlocks a major architectural decision in `.memory/decisions.md`.
2. **When NOT to update** — not on task-level checkpoints, not on bug fixes, not on intra-phase commits. Those belong to `.memory/checkpoint.md` and the per-task files. Grand-plan is **phase-granular**, not session-granular.
3. **Who** — whoever closes a phase-level milestone bumps the grand plan in the same commit. Matches the existing `CLAUDE.md` rule: "update `.plans/` in the same commit as the work — never defer".
4. **Freshness check** — the State Snapshot (§ above) carries a date. Any session that sees a snapshot older than ~14 days without a matching checkpoint explanation should flag it as suspect and reconcile against `.memory/checkpoint.md` before trusting grand-plan over checkpoint. Stale snapshots are a signal, not a failure state — there's a documented reconciliation path.

## Change Log

- **2026-04-17** — Merchant-admin T01 shipped. Phase 7 → Merchant admin workstream flips from 🔲 → 🟡 (T01 ✅, T02 next). State Snapshot bumped: last major milestone now points to the T01 deploy; blocker rolled forward to T02 (admin shell in `apps/storefront`).
- **2026-04-17** — Initial grand plan. Consolidates the three-pillar vision (previously only in `.research/best-ecommerce-strategy.md`) with the phase-based roadmap, current deployment state, and navigation to every other planning doc. Added to `CLAUDE.md` as the mandatory first-read at session start.
