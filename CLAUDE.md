# CommerceJS — Claude Context

## Session Start (Every Conversation — No Exceptions)

Before doing anything else — before answering questions, before writing code:

```
1. Read .plans/grand-plan.md      ← ENTRY POINT — vision, architecture, current phase, live deployments
2. Read .memory/checkpoint.md     ← latest session state + immediate next task
3. Read .plans/README.md          ← index of every planning doc (active / reference / archived)
4. git branch --show-current      ← confirm which branch you're on (rules differ per branch — see below)
```

> There is no `.agent/` directory. Older docs referenced `.agent/skills/…` and
> `.agent/rules/…`; those are gone. `grand-plan.md` + `.memory/` + `.plans/` are
> the whole context system now.

---

## What This Project Is

**CommerceJS** is a modular, provider-agnostic eCommerce toolkit for JavaScript/TypeScript. Every eCommerce platform (Salla, Shopify, Medusa, WooCommerce) speaks a different language; CommerceJS maps them all to one unified API via an adapter pattern.

Two product layers:
1. **Open-source SDK** — 17 published `@commercejs/*` npm packages (types, adapters, checkout engine, payments, delivery, notifications, analytics, storage, Nuxt module).
2. **CommerceJS Cloud (EaaS)** — a multi-tenant eCommerce-as-a-Service platform (think Salla/Shopify). Merchants sign up and get a storefront + admin + API + dedicated database. **Live on Fly.io.**

---

## Branches

| Branch | Stack | Role |
|---|---|---|
| **`fly/eaas`** | Fly.io + **Prisma** (primary) + Neon Postgres + BullMQ/Upstash | **Canonical, production-live.** All EaaS work happens here. |
| `main` | Cloudflare Pages + **Drizzle** (primary), Prisma at parity | Pre-pivot SDK/CF baseline. Kept alive; don't break it. |

On `fly/eaas`, keep `packages/platform/` changes **cherry-pick-compatible with `main`** — never delete or break Drizzle there. No Cloudflare on `fly/eaas` (no wrangler/D1/KV/Queues/Pages). No `@commercejs/cloud` imports on `fly/eaas`.

## Live Deployments (`fly/eaas`)

| Host | Purpose | Code |
|---|---|---|
| `app.commercejs.cloud` | Operator dashboard (login, merchants CRUD, provisioning) | `apps/dashboard/` (`:3000`) |
| `*.commercejs.cloud` | Hosted merchant storefront (SSR, per-tenant DB) | `apps/storefront/` (`:3001`) |
| `checkout.commercejs.cloud` | Hosted card payments (Tap, payment links, QR) | `apps/hosted-checkout/` (`:3002`) |
| `commercejs-cloud.fly.dev` | Fly edge — all three co-supervised by `scripts/start-web.sh` | `fly.toml` + `Dockerfile` |

Fly app `commercejs-cloud`, region **`fra` (Frankfurt) — live today**. `bah` (Bahrain/GCC) is the stated market target but is **not** deployed; region is an **open owner decision**, not settled.

---

## Monorepo Structure

```
packages/            # Published @commercejs/* packages
  types/ core/ checkout/ platform/ nuxt/ ui/
  adapter-salla/ adapter-medusa/
  payment-tap/ delivery-armada/ delivery-parcel/ webhook-verifier/
  notification-resend/ notification-smtp/ analytics-ga/ storage-s3/
  cloud/ cli/         # Cloudflare-era — FROZEN, main branch only
apps/                # Private
  dashboard/         # Operator dashboard + BullMQ worker.ts (Nuxt 4)
  storefront/        # Hosted merchant storefront + /admin (merchant admin UI)
  hosted-checkout/   # Tap card elements, payment links, QR
  docs/              # commerce.js.org
.memory/             # Versioned cross-session knowledge base (tracked)
.plans/              # Planning docs — start at .plans/README.md
```

---

## Commands

```bash
pnpm install
pnpm turbo run build typecheck --filter='!@commercejs/dashboard' --filter='!docs'
pnpm vitest run                                       # test suite
bash packages/platform/scripts/check-query-parity.sh  # Drizzle/Prisma parity
pnpm --filter @commercejs/dashboard build             # nuxt build + worker bundle
pnpm --filter <pkg> dev                               # run one package/app
pnpm changeset                                        # cut a release changeset

# Prisma (fly/eaas). prisma generate hard-errors without DATABASE_URL — pass a placeholder.
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm --filter @commercejs/platform exec prisma generate
```

---

## Architecture (fly/eaas)

Adapters map platform APIs to a unified `createCommerce()` interface. **Domains** = CRUD data sources (catalog, cart, orders); **Providers** = event-driven side effects (payments, delivery, notifications). Three domain tiers: Universal (catalog, store), Common (cart, checkout, orders, customers), Specialized (wholesale, subscriptions).

**Two-DB tenancy:** a singleton **control DB** (Neon project `cjs-control`: `merchants`, `api_keys`, `domains`, `dashboard_users`) + a **merchant DB per tenant** (its own **Neon branch**, cached Prisma client). Tenant resolved subdomain → `X-Commerce-Key` → custom domain, via the per-event `registerEventResolver()` + `useEvent()` binding (`event.context.db`) — concurrency-safe under multi-tenant traffic.

Async work runs in a standalone BullMQ `worker.ts` (Fly process): `provision-store`, `send-email`, `dispatch-webhook`.

---

## Locked Decisions (top 8 — full list in [`.memory/decisions.md`](.memory/decisions.md))

1. **Prisma is primary on `fly/eaas`** (control + merchant DBs). Drizzle stays primary on `main`; keep both at parity in `packages/platform/` and run `check-query-parity.sh` after query changes.
2. **Merchant DB = one Neon branch per merchant** (cached Prisma client). Control DB = singleton. *(Repo-locked as branch-per-merchant; if a project-per-merchant model is intended, that's an owner decision — flag it, don't assume.)*
3. **Provisioning is a background job** (BullMQ), never inline in a request handler. New provisioning lives in `apps/dashboard/server/utils/merchant-provisioner.ts` — **not** `@commercejs/cloud`.
4. **Neon operations retry with backoff** — Neon returns 423 Locked for ~3s after project/branch creation (2s base, 5 retries).
5. **Session cookies fail closed** — `NUXT_SESSION_PASSWORD` must be ≥32 chars in production or the app refuses to boot (`server/plugins/00-validate-session-seal.ts`). Never ship a hardcoded fallback to prod.
6. **`Profile`** is the cross-merchant buyer identity type (not `CustomerProfile`); tables `profiles`, `profile_addresses`, …
7. **Nitro preset `node-server`** on `fly/eaas` (never `cloudflare-pages`); no `@nuxthub/core` (D1/KV/Blob are CF-only).
8. **Each app gets a distinct `app.buildAssetsDir`** (dashboard `/_nuxt/`, storefront `/_storefront/`) so co-supervised apps don't 404 each other's bundles.

---

## Gotchas

Hard-won bugs live in [`.memory/gotchas.md`](.memory/gotchas.md) — most are **Fly/Nitro/Prisma**, not Cloudflare. Highlights: `NUXT_PUBLIC_*`/`NUXT_*` is the only way to inject runtime config at Fly runtime; `useEvent()` needs `nitro.experimental.asyncContext: true`; `prisma generate` needs a `DATABASE_URL` placeholder; `@types/node` must be a direct dep of any package using Node/DOM globals; `#!/bin/bash` (not dash) for `start-web.sh`.

---

## Workflow Rules

- **Read `grand-plan.md` first**, every session.
- Update `.plans/` and `.memory/` **in the same commit** as the work — never defer.
- Write session checkpoints to `.memory/checkpoints/` with a timestamp; keep `.memory/checkpoint.md` current.
- When a phase-level milestone closes (a `.plans/*/plan.md` flips to ✅, the current gate changes, a deployment is added), bump `grand-plan.md`'s phase table + State Snapshot in the same commit.
- New architectural decision → `.memory/decisions.md`. New gotcha → `.memory/gotchas.md`.
- Conventional commits. Author as `Claude <noreply@anthropic.com>`. Never commit `coverage/`, `.output/`, `.data/`, `node-compile-cache/`.

## What NOT to Do

- **No Cloudflare on `fly/eaas`** — no wrangler, D1, KV, CF Pages, CF Queues.
- **Don't break Drizzle in `packages/platform/`** — `main` still uses it; keep changes cherry-pick-compatible.
- **Don't import `@commercejs/cloud` on `fly/eaas`** — provisioning is in `dashboard/server/utils/`.
- **Don't inline provisioning** in request handlers — BullMQ jobs only.
- **Don't ship a shared merchant DB or `merchant_id` + RLS** — that model was explicitly rejected.
- **Don't skip `check-query-parity.sh`** when modifying platform domain queries.
- **Don't deploy or open PRs autonomously** — the human owns `fly deploy` and merges.
