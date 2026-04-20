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
| Merchant admin UI (T01–T05) | ✅ | [`merchant-admin/plan.md`](merchant-admin/plan.md) — all five tasks shipped (T01 ✅, T02 ✅, T03 ✅, T04 ✅, T05 ✅) |
| Merchant admin follow-up (T06–T13) | ✅ | [`merchant-admin-followup/plan.md`](merchant-admin-followup/plan.md) — all eight tasks shipped (T06 ✅ settings, T07 ✅ customers, T08 ✅ categories, T09 ✅ staff, T10 ✅ inventory, T11 ✅ analytics, T12 ✅ theming, T13 ✅ audit log) — merchant-admin scope CLOSED |
| Tap subscription billing (merchant SaaS plan charges) | 🔲 | No plan doc yet; `Merchant.tapCustomerId` column plumbed |
| Transactional emails (order confirmations, password resets, trial-ending) | 🔲 | No plan doc yet; `handleSendEmail` stub in `worker.ts` |

<!-- END PROGRESS SECTION -->

## 🎯 What's Next

**Merchant-admin scope CLOSED.** T06–T13 follow-up workstream shipped over
2026-04-19 → 2026-04-20 (eight commits, eight deploys, 8×N live acceptance
scenarios all green on `smoke.commercejs.cloud`). Every parent-deferred item
from the T01–T05 plan is now live: settings (T06), customers (T07), categories
CRUD (T08), staff management with local password (T09), inventory inline +
low-stock (T10), analytics expansion with revenue series + top products/
customers + AOV + refund rate (T11), storefront theming via CSS custom
properties (T12), and activity log / audit trail (T13). Merchants on
CommerceJS Cloud now have a self-service admin comparable to Shopify /
Salla at the feature set a real SMB store needs. No remaining admin-UI gap.
T13 also established the first live `CREATE TABLE IF NOT EXISTS` lazy-migrate
against a pre-existing Neon branch, confirming the pattern generalizes
beyond the `ADD COLUMN` case T09/T12 previously proved. **Next up to the
user** — the obvious next workstreams are (1) Tap subscription billing for
merchant SaaS plan charges (no plan doc yet; `Merchant.tapCustomerId` column
plumbed), (2) transactional emails (order confirmations + password resets
+ trial-ending; `handleSendEmail` stub in `worker.ts`), or (3) Step 9 of
the Fly migration plan (self-service signup + plan enforcement). T13
optionally enables a shared USelect-sentinel helper cleanup; see the
merchant-admin-followup Lessons Learned.

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
  State Snapshot · 2026-04-20
─────────────────────────────────────────────────────────
  Active branch:         fly/eaas
  Latest checkpoint:     .memory/checkpoint.md
  Last major milestone:  Merchant-admin-followup T13 (audit log /
                         activity feed) shipped + deployed + 9/9
                         acceptance green on smoke.commercejs.cloud —
                         **closing the merchant-admin-followup
                         workstream entirely (T06–T13 all ✅)**.
                         Platform: new activity_events table with
                         three indexes on (created_at DESC),
                         (actor_id), (entity_type, entity_id) on both
                         Prisma + Drizzle; first live test of
                         `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX
                         IF NOT EXISTS` via the lazy-migrate pattern
                         that T09/T12 previously proved for ADD COLUMN.
                         Smoke's pre-existing Neon branch picked it up
                         on first /api/admin/activity request — no
                         manual step. AdminAPI.recordActivity (append-
                         only) + AdminAPI.listActivity (paginated,
                         filterable by actorId/entityType/date range,
                         reuses parseFromBound+parseToBound). Types
                         (ActivityEvent, RecordActivityInput,
                         ListActivityParams) live in
                         packages/platform/src/admin/types.ts rather
                         than @commercejs/types — platform-admin-only
                         concern, no cross-package consumer, so
                         avoided the types→core→platform rebuild
                         cascade. 9 unit tests. Query parity 153/153.
                         Dashboard: apps/dashboard/server/utils/audit.ts
                         fire-and-forget helper reads
                         getMerchantSession → userId/email snapshot,
                         blanket try/catch so audit-write failure never
                         fails the business mutation. 15 existing
                         mutation routes retrofitted with recordActivity
                         AFTER the successful platform call (products,
                         orders, categories, customers, inventory,
                         settings, staff). Storefront: /admin/activity.vue
                         timeline grouped by day (Today/Yesterday/
                         dated), each row shows actor email +
                         humanized verb + entity badge + entity link +
                         relative time. Filters match T11 analytics UX
                         (actor + entityType dropdowns, date-range
                         preset). useActivityLabel composable with
                         raw-action fallback. Sidebar "Activity" link
                         between Theme and Settings. Three commits:
                         `2131a45` platform + `82645cf` apps +
                         `963a125` (out-of-scope USelect-sentinel fix
                         for products/index.vue status filter and
                         theme.vue font dropdown — same Reka
                         empty-string pattern T08 already addressed).
                         Acceptance: (1) fulfill → row with
                         action='order.fulfilled' + actorEmail=owner;
                         (2) second admin Alice took an action →
                         timeline distinguishes actors; (3) filter
                         actorId narrows to 1; (4) filter
                         entityType=product narrows to 1; (5)
                         today-only=3, yesterday-only=0; (6) deleted
                         Alice → her past row still renders with
                         snapshot actorEmail; (7) 5 live mutations
                         all 200 + audit rows landed (fire-and-forget
                         verified via code + 9 unit tests + live);
                         (8) unauth=401, cross-tenant=404;
                         (9) lazy-migrate verified — no manual step.
                         Lessons Learned filled in with eight
                         workstream-wide findings (most important:
                         ship a shared USelect-sentinel helper before
                         the next admin task — four consumers deep).
  Current blocker:       None. Merchant-admin-followup workstream
                         closed. Awaiting user direction on the next
                         workstream — three obvious candidates:
                         (1) Tap subscription billing for merchant SaaS
                         plan charges, (2) transactional emails
                         (handleSendEmail stub in worker.ts), or (3)
                         Step 9 self-service signup + plan enforcement.
  Open carry-overs:      (1) Changeset attached but unreleased for
                         @commercejs/storage-s3 v0.2.0 → 0.2.1 presign
                         signature fix — run `pnpm release` to publish.
                         (2) NUXT_* prefix gotcha has bitten 3× — keep
                         near top of .memory/gotchas.md.
                         (3) platform-hardening follow-up still owed —
                         categories deleteCategory silent orphaning,
                         updateCategory self-parent cycle, Category type
                         omits sortOrder (surfaced during T08).
                         (4) bcrypt.compareSync carry-over on
                         packages/platform/src/admin/auth.ts — swap to
                         async compare (T01-review finding).
                         (5) T13 UX polish — "deleted" chip only fires
                         for system actions (actorId null), not deleted
                         staff whose orphan UUID stays on the row.
                         (6) USelect sentinel helper — four consumers
                         (T08 '__root__', T13 'all', T12-fix
                         '__default__', T03 status filter). One
                         composable would kill the repetition.
                         (7) Smoke merchant schema drift
                         (products.id=UUID vs order_items.product_id=
                         TEXT) — addressed inline via ::text casts in
                         analytics; any new raw SQL join needs the
                         same guard until normalized.
  Last updated:          2026-04-20
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

- **2026-04-20** — Merchant-admin-followup T13 (audit log / activity feed) shipped + deployed + 9/9 acceptance green on smoke.commercejs.cloud. **Merchant-admin-followup workstream CLOSED (T06–T13 all ✅).** Phase 7 gains a new row "Merchant admin follow-up (T06–T13) ✅" referencing merchant-admin-followup/plan.md. Platform: activity_events table + 3 indexes on both Prisma + Drizzle drivers, first live test of CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS via the lazy-migrate pattern (T09/T12 previously proved ADD COLUMN); smoke's pre-existing Neon branch picked up the table on first request with no manual step. New AdminAPI.recordActivity (append-only) + listActivity (paginated + filterable) with types kept inside @commercejs/platform/admin (not @commercejs/types — platform-admin-only concern, avoided cross-package rebuild). 9 unit tests. Query parity 153/153. Dashboard: apps/dashboard/server/utils/audit.ts fire-and-forget helper + /api/admin/activity.get.ts Zod-validated route + 15 existing mutation routes retrofitted with recordActivity after the successful platform call. Storefront: /admin/activity.vue timeline (day-grouped, actor/entity/date filters mirror T11) + useActivityLabel composable + sidebar "Activity" link. Three commits on fly/eaas: `2131a45` (platform) + `82645cf` (apps) + `963a125` (out-of-scope USelect-sentinel fixes on products/index.vue + theme.vue — fourth and fifth appearances of the Reka empty-string-crash pattern). Eight-workstream Lessons Learned filled in at merchant-admin-followup/plan.md; most actionable next step is a shared USelect-sentinel helper. State Snapshot rewritten; "What's Next" rewritten to reflect workstream closure; three obvious next candidates surfaced (Tap billing / transactional emails / Step 9 self-service signup). No remaining admin-UI gap on CommerceJS Cloud merchants.
- **2026-04-20** — Merchant-admin-followup T12 (storefront theming v1) shipped + deployed + 12/12 acceptance green on smoke.commercejs.cloud. Platform gains 6 theme columns on store_info (Prisma + Drizzle), idempotent lazy-migrate on both sides; `StoreTheme` added to @commercejs/types and surfaced on `StoreInfo.theme`; admin `StoreSettings` + `UpdateStoreInput` gain 6 flat fields. Storefront injects `:root { --cjs-* }` via `useHead` in app.vue from `useStoreInfo().store.theme` (deviates from T12.md's Nitro render:html plugin — the storefront is remote-mode with no `event.context.db`; `useHead` on the already-fetched store info gives the same rendered output with one less round-trip). Homepage hero conditionally renders a full-bleed themed hero when `heroImageUrl` is set, otherwise gradient hero with the merchant's heading substituted in; Shop Now CTA uses `var(--cjs-primary, var(--ui-primary))`. New `/admin/theme.vue` page with native color pickers + curated font dropdown + hero image upload reusing T04 presign (`context: 'theme'`) + sticky live-preview card. Sidebar gets a "Theme" link between Staff and Settings. Query parity green 151/151. 7 unit tests added. Two commits: platform (`76d9cb7`) + apps (`d438d70`). State Snapshot bumped; merchant-admin-followup plan T12 ✅ (T06–T12 done; T13 still pending).
- **2026-04-17** — Dashboard tenant middleware migrated to per-event Prisma binding. New Nitro plugin at `apps/dashboard/server/plugins/platform-event-resolver.ts` registers `useEvent()` with `@commercejs/platform`. `apps/dashboard/server/middleware/tenant.ts` now sets `event.context.db = prismaClient` before `ensureAdapter()` and drops the `bindDb()` call. Mirror of the pattern that `apps/hosted-checkout` has been running in prod. The "Parallel (non-blocking) track" row in "What's Next" flipped from pending → shipped, and the matching open carry-over was cleared from State Snapshot. No API surface change — all 22 admin/storefront handlers continue reading `event.context.adapter`/`admin`/`merchant`. Verified live on smoke.commercejs.cloud: login, admin.listOrders, admin.listProducts, admin.stats, storefront catalog/store, and SSR homepage all still return 200.
- **2026-04-17** — Merchant-admin T05 shipped (orders list + detail, read-first). Phase 7 → Merchant admin workstream flips 🟡 → ✅ (T01 + T02 + T03 + T04 + T05 all ✅; merchant-admin plan fully closed). State Snapshot bumped: last major milestone points to T05 (four new `/api/admin/orders/*` routes + two pages wrapping `admin.listOrders/getOrder/fulfillOrder/refundOrder`); current blocker cleared — the only remaining item is the explicit-go `fly deploy` + 8-scenario acceptance on `smoke.commercejs.cloud`. "What's Next" section revised to reflect plan closure. **Gate decision documented**: History panel SKIPPED because `AdminAPI.getOrder` returns `Order` without an audit trail (the platform's domain-layer `getOrderHistory` is intentionally not surfaced on the admin API — per T05 gate rule, don't extend the platform API in this task). **Status enum clarification**: platform uses `pending | processing | shipped | delivered | cancelled | refunded | returned` — no `paid` / `fulfilled`; "Mark fulfilled" writes `status='shipped'`.
- **2026-04-17** — Merchant-admin T04 shipped. Phase 7 → Merchant admin workstream stays 🟡 (T01 ✅ + T02 ✅ + T03 ✅ + T04 ✅; T05 next). State Snapshot bumped: last major milestone points to image upload + Fly Tigris provisioning, blocker rolled forward to T05 (orders list + detail). New carry-over added: changeset pending for the upstream `@commercejs/storage-s3` presign signature bug fix (X-Amz-Expires was being set post-sign, invalidating the signature) — v0.2.0 → 0.2.1 patch bump. Admin row in the Phase 7 workstreams table shows T04 ✅.
- **2026-04-17** — Merchant-admin T03 shipped. Phase 7 → Merchant admin workstream stays 🟡 (T01 ✅ + T02 ✅ + T03 ✅; T04 next). State Snapshot bumped: last major milestone points to products CRUD, blocker rolled forward to T04 (image upload). Admin row in the Phase 7 workstreams table shows T03 ✅.
- **2026-04-17** — Merchant-admin T02 shipped. State Snapshot bumped: last major milestone now points to the admin shell; blocker rolled forward to T03 (products CRUD). Merchant-admin row in the Phase 7 table updated to show T01 ✅ + T02 ✅.
- **2026-04-17** — Merchant-admin T01 shipped. Phase 7 → Merchant admin workstream flips from 🔲 → 🟡 (T01 ✅, T02 next). State Snapshot bumped: last major milestone now points to the T01 deploy; blocker rolled forward to T02 (admin shell in `apps/storefront`).
- **2026-04-17** — Initial grand plan. Consolidates the three-pillar vision (previously only in `.research/best-ecommerce-strategy.md`) with the phase-based roadmap, current deployment state, and navigation to every other planning doc. Added to `CLAUDE.md` as the mandatory first-read at session start.
