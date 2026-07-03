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

Full backlog + architecture vision → [`roadmap.md`](roadmap.md).

> **Pillars vs phases.** Pillars are product-shape framing; phases are delivery framing. They overlap but are not 1:1 — e.g. Phase 7 covers Pillar 1 Cloud almost entirely, most of Pillar 2 Store, and ships the hosted-checkout surface for Pillar 3. Use pillars to explain *what we sell*; use phases to track *what we're building*.

## Architecture at a Glance

- **Two product layers** — 17 published `@commercejs/*` packages (types, core, nuxt module, platform engine, adapters, providers) **+** `commercejs-cloud` multi-tenant EaaS.
- **Two-DB model** — control DB (singleton Prisma client; `merchants`, `api_keys`, `domains`, `dashboard_users`) **+** per-merchant DB (cached Prisma client per tenant; commerce data on a dedicated Neon branch).
- **Tenant resolution** — subdomain → `X-Commerce-Key` header → custom domain, LRU-cached, with a `registerEventResolver()` per-event binding pattern that scales under concurrent multi-tenant traffic.
- **Three co-supervised Fly processes** per web machine — dashboard `:3000`, storefront `:3001`, hosted-checkout `:3002` — orchestrated by `scripts/start-web.sh` with hostname-routing middleware.
- **Async work** — BullMQ + Upstash Redis standalone worker process (`worker.ts`) handles Neon provisioning, webhook dispatch, and (soon) transactional email.

Full patterns → [`../CLAUDE.md`](../CLAUDE.md). Locked architectural decisions → [`.memory/decisions.md`](../.memory/decisions.md).

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
| Merchant admin UI (T01–T05) | ✅ | [`merchant-admin/plan.md`](merchant-admin/plan.md) — all five tasks shipped (T01 ✅, T02 ✅, T03 ✅, T04 ✅, T05 ✅) |
| Tap subscription billing (merchant SaaS plan charges) | 🔲 | No plan doc yet; `Merchant.tapCustomerId` column plumbed |
| Transactional emails (order confirmations, password resets, trial-ending) | 🔲 | No plan doc yet; `handleSendEmail` stub in `worker.ts` |

<!-- END PROGRESS SECTION -->

## 🎯 What's Next

**The gate just closed.** Merchant-admin **T01 + T02 + T03 + T04 + T05 shipped 2026-04-17** — all five tasks from the merchant-admin plan are ✅. Merchants can sign up, get provisioned, log in to `/admin`, CRUD products with image uploads (Fly Tigris, per-merchant prefix), and now view + fulfill + refund orders. T05 added `/api/admin/orders/{index,[id],[id]/fulfill,[id]/refund}` under the dashboard (all `requireMerchantSession`-gated, Zod-validated, wrapping `admin.listOrders/getOrder/fulfillOrder/refundOrder`), plus `/admin/orders/{index,[id]}.vue` in the storefront (filterable list + six-panel detail + fulfill/refund modals). History panel was deliberately skipped (AdminAPI doesn't expose `getOrderHistory`; don't extend the platform API in T05). Status enum is the platform's actual `pending | processing | shipped | delivered | cancelled | refunded | returned` — "Mark fulfilled" writes `status='shipped'`. Build green on both apps. Next **up to the user** (no follow-up gate in this plan — Settings, staff invites, customer management, analytics, and theming are the follow-up plan). Immediate carry-over: deploy T05 to `smoke.commercejs.cloud` when given the go.

**Parallel (non-blocking) track.** ✅ Landed 2026-04-17 alongside T05 — the dashboard's tenant middleware now uses the per-event `registerEventResolver()` + `useEvent()` pattern that `apps/hosted-checkout` already runs. `event.context.db = prismaClient` is set in the middleware before `ensureAdapter()`, and a Nitro plugin wires the platform's `getDb()` to read from there. The race-prone `bindDb()` + `initPrisma()` fallback is gone from the dashboard request path (worker + provisioner still use explicit `runWithDb()` callbacks, which are unaffected). Verified live on `smoke.commercejs.cloud` — login, admin.listOrders, admin.listProducts, admin.stats, storefront catalog/store, and SSR homepage all still 200. Multi-merchant concurrent prod traffic is now safe.

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
  Last major milestone:  Merchant-admin T05 (orders list + detail,
                         read-first) shipped — four new
                         /api/admin/orders/* routes +
                         apps/storefront/app/pages/admin/orders/
                         {index,[id]}.vue wrapping admin.listOrders/
                         getOrder/fulfillOrder/refundOrder. History
                         panel intentionally skipped per gate (AdminAPI
                         doesn't expose getOrderHistory — don't extend
                         the platform API in T05). Closes the
                         merchant-admin plan: T01+T02+T03+T04+T05 all
                         ✅. Build green on dashboard + storefront,
                         pending live deploy to smoke.commercejs.cloud.
  Current blocker:       None in the merchant-admin scope. Awaiting
                         explicit "go" to `fly deploy` T05 and run the
                         8-scenario acceptance on smoke.commercejs.cloud.
                         Beyond that, no follow-up task is queued — the
                         next plan (settings / staff / customers /
                         analytics / theming) is TBD by the user.
  Open carry-overs:      (1) Changeset attached but unreleased for
                         @commercejs/storage-s3 v0.2.0 → 0.2.1 presign
                         signature fix — run `pnpm release` to publish.
                         (2) NUXT_* prefix gotcha has bitten 3× — keep
                         near top of .memory/gotchas.md.
                         (Dropped 2026-04-17: dashboard tenant middleware
                         migrated to per-event registerEventResolver() +
                         useEvent() — bindDb()+initPrisma() race-prone
                         fallback is out of the request path.)
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
| All planning docs (index) | [`README.md`](README.md) |
| Build chain, package map, patterns | [`../CLAUDE.md`](../CLAUDE.md) |

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

- **2026-07-03** — Security + baseline hardening + M0.5 docs/CI reorg (branch `claude/commercejs-m0-m05-push-il5lep`, cut from live `fly/eaas`). **Fail-closed session seal**: prod now refuses to boot without a ≥32-char `NUXT_SESSION_PASSWORD` (was silently falling back to a public key — forgeable operator/merchant/buyer cookies); shared `sessionSeal.ts` + boot plugin + `/api/_health.sessionSealSecure`, boot-verified both ways, locked in `.memory/decisions.md`. Fixed `@commercejs/core` standalone typecheck (`@types/node`) — it was red on `fly/eaas` because **CI never ran there**; `ci.yml` now triggers on `fly/eaas`/`claude/**` and gained a dashboard job (prisma generate → build → worker `--dry-run`). New `docker.yml` (build, no push) + gated `fly-deploy.yml`. Docs: `.plans/README.md` index + `archive/`, CLAUDE.md rewritten for live reality (dead `.agent/*` refs removed), `CONTRIBUTING.md` from `CI_CD_GUIDE.md`, coverage/node-cache un-tracked. Note: a handoff-described "M0" reconciliation (11 commits) was found unrecoverable in this container — see `.memory/checkpoints/2026-07-03T1930.md`. **Open owner decisions**: Neon sharding (repo locks branch-per-merchant; handoff said project-per-merchant), region (`fra` live / `bah` target), recover lost M0 work?
- **2026-04-17** — Dashboard tenant middleware migrated to per-event Prisma binding. New Nitro plugin at `apps/dashboard/server/plugins/platform-event-resolver.ts` registers `useEvent()` with `@commercejs/platform`. `apps/dashboard/server/middleware/tenant.ts` now sets `event.context.db = prismaClient` before `ensureAdapter()` and drops the `bindDb()` call. Mirror of the pattern that `apps/hosted-checkout` has been running in prod. The "Parallel (non-blocking) track" row in "What's Next" flipped from pending → shipped, and the matching open carry-over was cleared from State Snapshot. No API surface change — all 22 admin/storefront handlers continue reading `event.context.adapter`/`admin`/`merchant`. Verified live on smoke.commercejs.cloud: login, admin.listOrders, admin.listProducts, admin.stats, storefront catalog/store, and SSR homepage all still return 200.
- **2026-04-17** — Merchant-admin T05 shipped (orders list + detail, read-first). Phase 7 → Merchant admin workstream flips 🟡 → ✅ (T01 + T02 + T03 + T04 + T05 all ✅; merchant-admin plan fully closed). State Snapshot bumped: last major milestone points to T05 (four new `/api/admin/orders/*` routes + two pages wrapping `admin.listOrders/getOrder/fulfillOrder/refundOrder`); current blocker cleared — the only remaining item is the explicit-go `fly deploy` + 8-scenario acceptance on `smoke.commercejs.cloud`. "What's Next" section revised to reflect plan closure. **Gate decision documented**: History panel SKIPPED because `AdminAPI.getOrder` returns `Order` without an audit trail (the platform's domain-layer `getOrderHistory` is intentionally not surfaced on the admin API — per T05 gate rule, don't extend the platform API in this task). **Status enum clarification**: platform uses `pending | processing | shipped | delivered | cancelled | refunded | returned` — no `paid` / `fulfilled`; "Mark fulfilled" writes `status='shipped'`.
- **2026-04-17** — Merchant-admin T04 shipped. Phase 7 → Merchant admin workstream stays 🟡 (T01 ✅ + T02 ✅ + T03 ✅ + T04 ✅; T05 next). State Snapshot bumped: last major milestone points to image upload + Fly Tigris provisioning, blocker rolled forward to T05 (orders list + detail). New carry-over added: changeset pending for the upstream `@commercejs/storage-s3` presign signature bug fix (X-Amz-Expires was being set post-sign, invalidating the signature) — v0.2.0 → 0.2.1 patch bump. Admin row in the Phase 7 workstreams table shows T04 ✅.
- **2026-04-17** — Merchant-admin T03 shipped. Phase 7 → Merchant admin workstream stays 🟡 (T01 ✅ + T02 ✅ + T03 ✅; T04 next). State Snapshot bumped: last major milestone points to products CRUD, blocker rolled forward to T04 (image upload). Admin row in the Phase 7 workstreams table shows T03 ✅.
- **2026-04-17** — Merchant-admin T02 shipped. State Snapshot bumped: last major milestone now points to the admin shell; blocker rolled forward to T03 (products CRUD). Merchant-admin row in the Phase 7 table updated to show T01 ✅ + T02 ✅.
- **2026-04-17** — Merchant-admin T01 shipped. Phase 7 → Merchant admin workstream flips from 🔲 → 🟡 (T01 ✅, T02 next). State Snapshot bumped: last major milestone now points to the T01 deploy; blocker rolled forward to T02 (admin shell in `apps/storefront`).
- **2026-04-17** — Initial grand plan. Consolidates the three-pillar vision (previously only in `.research/best-ecommerce-strategy.md`) with the phase-based roadmap, current deployment state, and navigation to every other planning doc. Added to `CLAUDE.md` as the mandatory first-read at session start.
