# Checkpoint

> Latest detailed checkpoint: [`.memory/checkpoints/2026-04-16T0200.md`](checkpoints/2026-04-16T0200.md)
> Previous Step 8 (Fly.io deployment) checkpoint content is preserved in git history if needed.

## Current Phase

**Phase 7 Storefront EaaS — Tasks T01–T04 + phase-1 composable rewrite all SHIPPED and LIVE.**

The Fly.io EaaS pipeline (Steps 1–8) provisions merchant Neon branches in
~6 seconds. On top of that, the full four-layer storefront architecture
is now running on `commercejs-cloud.fly.dev`:

- `app.commercejs.cloud` → platform-operator dashboard (T01 API routes at `/api/storefront/*`)
- `smoke.commercejs.cloud` → merchant storefront, SSR'd on a co-supervised `:3001` process, styled with `@nuxt/ui` v4, asset bundles at `/_storefront/*`
- `nonexistent.commercejs.cloud` → generic shell, no cross-tenant bleed
- `@commercejs/nuxt` composables (`useCart`, `useCheckout`, `useBrands`, `useLocations`) all speak T01's session-based contract

Branch: `fly/eaas` · Latest commit: `95fcd78`

## What's Blocking "Real Merchant Onboarding"

1. **Smoke tenant has zero products** → `/api/storefront/products` returns `[]`. Browser add-to-cart can't be exercised until catalog data exists.
2. **No merchant admin UI** → merchants have no way to CRUD products / view orders. The existing `apps/dashboard` is platform-operator-facing (manages merchants), not merchant-facing.

## Next Step (Recommended)

**(A) Seed smoke tenant (~30 min), then (B) merchant admin UI (days).**

Full ranked menu with rationale + implementation notes in [`.plans/storefront-eaas/plan.md`](../.plans/storefront-eaas/plan.md) "Next Steps" section.

## Where to Look

| Question | File |
|---|---|
| What shipped this session and what's next? | `.memory/checkpoints/2026-04-16T0200.md` |
| Storefront EaaS strategy + ranked next-steps | `.plans/storefront-eaas/plan.md` |
| T01–T04 execution + challenges | `.plans/storefront-eaas/tasks/T01.md` – `T04.md` |
| Architectural decisions (locked) | `.memory/decisions.md` |
| Hard-won bugs | `.memory/gotchas.md` |
| Phase 7 roadmap state | `.plans/roadmap.md` |
| Project-wide Claude instructions | `CLAUDE.md` |

## Strategic Context (unchanged)

- **Goal**: EaaS platform (merchant signs up → gets storefront + admin + API + dedicated DB) AND open-source SDK recognition (like Medusa)
- **Why Fly.io**: CF Workers hit hard limits — 50 subrequest cap, WASM-only Prisma, no standard Node.js. Fly.io = standard Node.js, no constraints.
- **OSS story**: The hosted API (T01) + `@commercejs/nuxt` remote mode (T02) means self-hosters get the same shape as EaaS customers — single codebase, two deployment paths.
- **Market**: MENA-first (Bahrain region, Arabic RTL, Tap/stcpay/Mada/Tabby/Tamara).

## Live Deployment

- **App**: `commercejs-cloud` (Fly.io, Frankfurt)
- **Machines**: 2 web (co-supervised dashboard + storefront) + 1 worker + 1 standby worker
- **Image**: latest deployment in `fly deploy` log — check with `fly status --app commercejs-cloud`
- **Health**: `https://commercejs-cloud.fly.dev/api/_health` → 200

## Session-Starting Checklist

1. Read this file → points at the detailed checkpoint
2. Read `.memory/checkpoints/2026-04-16T0200.md` → commit list, architecture, next steps
3. Read `.plans/storefront-eaas/plan.md` "Next Steps" section
4. `git log --oneline fly/eaas -10` → scan recent work
5. `git status` → confirm clean tree
6. Pick a task from the ranked menu
