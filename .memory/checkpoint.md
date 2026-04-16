# Checkpoint

> Latest detailed checkpoint: [`.memory/checkpoints/2026-04-17T1800.md`](checkpoints/2026-04-17T1800.md)
> Previous checkpoint: [`.memory/checkpoints/2026-04-16T1900.md`](checkpoints/2026-04-16T1900.md)

## Current Phase

**Phase 7 Storefront EaaS — T01–T04 + phase-1 composables + next-step (A) seed + carry-over #1 (hosted-checkout card payments) all SHIPPED and BROWSER-VERIFIED. Merchant-admin plan locked in; T01 is the next entry point.**

The Fly.io EaaS pipeline (Steps 1–8) provisions merchant Neon branches in
~6 seconds. On top of that, the full four-layer storefront architecture
is now running and browser-verified end-to-end on `smoke.commercejs.cloud`:

- `app.commercejs.cloud` → platform-operator dashboard (T01 API routes at `/api/storefront/*`)
- `smoke.commercejs.cloud` → merchant storefront, SSR'd on a co-supervised `:3001` process, styled with `@nuxt/ui` v4, asset bundles at `/_storefront/*`, populated with 4 sample products + 6 GCC countries
- `nonexistent.commercejs.cloud` → generic shell, no cross-tenant bleed
- `@commercejs/nuxt` composables (`useCart`, `useCheckout`, `useBrands`, `useLocations`) all speak T01's session-based contract; cart badge renders via Nuxt UI v4 `<UChip>`; `/cart` direct-visit works

Branch: `fly/eaas` · Latest commit lands after this session

## What's Blocking "Real Merchant Onboarding"

1. ~~**Credit-card checkout route 404s**~~ ✅ Fixed 2026-04-16 (this session) — `apps/hosted-checkout` now runs as a third co-supervised Fly process on `:3002`. Full card-payment path works end-to-end via Tap.
2. **No merchant admin UI** → merchants have no way to CRUD products / view orders. The existing `apps/dashboard` is platform-operator-facing (manages merchants), not merchant-facing.

## Next Step (Recommended)

**Merchant-admin T01 — auth foundation.** See `.plans/merchant-admin/plan.md` → Next Steps. Deliverable: `curl -i -X POST {sub}.commercejs.cloud/api/admin/auth/login` returns 200 with a `cjs-merchant-session` cookie.

Parallel track (non-blocking): migrate dashboard's tenant middleware from `bindDb()` + `initPrisma()` fallback to the per-event `registerEventResolver()` + `useEvent()` pattern that hosted-checkout now uses. Required before multi-merchant production traffic — see `.memory/checkpoints/2026-04-17T1800.md` "Carry-Overs".

## Where to Look

| Question | File |
|---|---|
| Project orientation + current phase (start here) | `.plans/grand-plan.md` |
| What shipped this session and what's next? | `.memory/checkpoints/2026-04-17T1800.md` |
| Previous session handoff | `.memory/checkpoints/2026-04-16T1000.md` |
| Merchant admin UI plan | `.plans/merchant-admin/plan.md` |
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
2. Read `.memory/checkpoints/2026-04-17T1800.md` → commit list, architecture, carry-overs
3. Read `.plans/merchant-admin/plan.md` "Next Steps" section (T01 entry point)
4. `git log --oneline fly/eaas -10` → scan recent work
5. `git status` → confirm clean tree
6. Start T01 of merchant-admin (auth foundation)
