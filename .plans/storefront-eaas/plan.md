# Storefront EaaS Architecture — Plan

> **Context**: The Fly.io EaaS platform (Steps 1–8) is live and provisioning merchant DBs. The next major
> product surface is giving those merchants a storefront. This plan documents the architecture strategy
> and implementation roadmap agreed in the 2026-04-15 session.

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [x] **Research & Strategy Selection** ✅ Completed (2026-04-15)

* [x] [**T01**: Storefront API routes in dashboard app](tasks/T01.md) - Status: ✅ Completed (deployed; live smoke test passed 2026-04-15)
* [ ] [**T02**: `@commercejs/nuxt` remote mode](tasks/T02.md) - Status: 🟡 Planned
* [ ] [**T03**: `apps/storefront` — Fly.io migration](tasks/T03.md) - Status: 🟡 Planned
* [ ] [**T04**: Hosted SSR as second Fly.io process](tasks/T04.md) - Status: 🟡 Planned

<!-- END PROGRESS SECTION -->

---

## Research & Strategy Selection
**Status**: ✅ **Completed**

### Goal

Determine how merchant subdomains (`smoke.commercejs.cloud`) serve a storefront, and establish
the path from a headless API to a fully hosted EaaS storefront — without throwing anything away.

### Context

After Steps 1–8, `*.commercejs.cloud` resolves to the Fly app and the tenant middleware correctly
binds `event.context.adapter` per merchant. But there are no storefront routes or pages — the
dashboard UI is served for every subdomain, which is wrong.

The core constraint is that Nuxt is a single-app framework; one Nitro server can only host one
Nuxt instance. The dashboard and a hosted storefront cannot share a process for SSR.

**Key questions answered in research:**
- Are we selling a headless API (Medusa model) or a hosted storefront (Shopify/Salla model)?
- Is there a path from one to the other without architectural rework?
- How does a self-hosted storefront authenticate and call the API?
- What happens with custom domains — is a proxy needed?

### Strategy Proposals

**Option A — Headless API only (same Fly app)**
- Add `/api/storefront/*` routes to the dashboard app. They thin-wrap `event.context.adapter`
  which the tenant middleware already populates. No SSR storefront hosted.
- Pros: Ships in hours. Zero new infrastructure. Unblocks developer integrations immediately.
  Perfectly matches the OSS SDK story (`@commercejs/nuxt` → self-hosted storefront).
- Cons: No hosted storefront. Non-technical merchants can't sell without deploying their own UI.

**Option B — Two Fly apps, hosted SSR**
- Second `commercejs-storefront` Fly app. Reads `CONTROL_DATABASE_URL` for tenant resolution.
  Full Nuxt SSR at `*.commercejs.cloud`. Dashboard stays at `app.commercejs.cloud`.
- Pros: Full SSR per merchant. Clean separation. Independent deploy/scale.
- Cons: Separate deploy pipeline. Control DB access duplicated. Can't share tenant middleware.

**Option C — Single Fly app, multi-process hybrid**
- Dashboard process (port 3000) + Storefront process (port 3001) behind a hostname-routing
  proxy layer in the same `fly.toml`. `app.` traffic → dashboard. `*.` traffic → storefront.
  The storefront process is a full Nuxt SSR app with its own tenant binding.
- Pros: One Fly app, one deploy, full SSR for both. Custom domains work automatically via
  the existing tenant resolver.
- Cons: Proxy layer adds complexity. Two build outputs in one Dockerfile.

### Selected Approach

**Decision**: Phased hybrid — Option A first, then Option C.

**Rationale**:
The two questions ("headless API" vs "hosted storefront") have a clean layered answer:
build the API layer first (Option A), then add the hosted SSR layer on top (Option C) without
changing anything. The API routes serve both audiences — EaaS merchants whose storefront calls
them locally, and self-hosting developers who call them remotely. Option B was rejected because
it duplicates infrastructure and makes custom-domain routing harder (two Fly apps, one wildcard
cert).

**Key Findings**:

1. **The architecture is naturally layered.** Three levels: Tenant DB + provisioning (done) →
   Storefront API (Phase 1) → Hosted SSR storefront (Phase 2). Each layer consumes the one below.
   Phase 1 work is a direct subset of what Phase 2 needs — nothing gets replaced.

2. **Custom domain = API endpoint, no proxy needed.** The tenant resolver already handles
   custom domains via the `Domain` table. When a merchant adds `shop.acme.com` and CNAMEs it to
   the Fly app, that domain IS the API — `shop.acme.com/api/storefront/*` resolves via the
   existing `resolveByCustomDomain()` lookup. No proxy layer anywhere.

3. **Self-hosted storefronts use `apiRoutes: false` + remote `apiBase`.**
   The `@commercejs/nuxt` module already has this switch. With `apiRoutes: false`, all 16
   composables call the absolute `apiBase` URL instead of registering local routes. Server-side
   calls are Node→Node (no CORS). Client-side calls proxy through the Nuxt server (no CORS).
   The merchant configures `NUXT_COMMERCE_API_BASE=https://acme.commercejs.cloud/api/storefront`
   and `NUXT_COMMERCE_API_KEY=cjs_live_xxx`. No DB URL needed.

4. **This is the OSS ↔ EaaS flywheel.** Self-hosted merchants use the open-source
   `@commercejs/nuxt` module against the hosted API. Hosted merchants get SSR for free. The
   same API routes power both. Medusa uses this exact model.

5. **`app.commercejs.cloud` is the dashboard.** Added to `PLATFORM_HOSTS` in tenant resolver
   so it is never mistaken for a merchant subdomain. Reserved subdomain list (100+ entries)
   enforced at API and form level.

**Implementation Plan**:
1. Add `/api/storefront/*` routes to `apps/dashboard` as thin wrappers over `event.context.adapter` (T01)
2. Extend `@commercejs/nuxt` with client-side proxy handler for `apiRoutes: false` mode (T02)
3. Migrate `apps/storefront` to `node-server` preset + merchant config injection (T03)
4. Add storefront as a second process in the dashboard's `fly.toml` + hostname proxy middleware (T04)
5. Update `roadmap.md` Phase 7 to reflect the Fly.io EaaS reality

### Dependencies

- Tenant middleware (`apps/dashboard/server/middleware/tenant.ts`) — ✅ done, populates `event.context.adapter`
- `event.context.adapter` typed interface (`apps/dashboard/server/types/h3-context.d.ts`) — ✅ done
- `PLATFORM_HOSTS` + reserved subdomains — ✅ done (this session)

### Related Files

- `apps/dashboard/server/middleware/tenant.ts` — tenant binding, skip list, adapter cache
- `apps/dashboard/server/utils/tenant.ts` — resolver, `PLATFORM_HOSTS`, custom domain lookup
- `apps/dashboard/shared/utils/reservedSubdomains.ts` — reserved subdomain list (new)
- `packages/nuxt/src/module.ts` — `apiRoutes` / `apiBase` options
- `packages/nuxt/src/runtime/composables/` — 16 composables that call `apiBase`
- `apps/storefront/nuxt.config.ts` — currently on `cloudflare-pages` preset
- `.plans/fly-migration-plan.md` — Steps 1–8 (complete)

---

## Architecture Reference

### The Three-Layer Model

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3 — Hosted SSR Storefront          [Phase 2 / T03, T04] │
│  apps/storefront (Nuxt, node-server)                            │
│  Served at *.commercejs.cloud by storefront Fly process         │
│  Reads Layer 2 directly (local adapter call, no HTTP)           │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2 — Storefront API                 [Phase 1 / T01, T02] │
│  apps/dashboard server/api/storefront/*                         │
│  Thin wrappers over event.context.adapter                       │
│  Used by: EaaS storefront (local) + self-hosted (remote)        │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1 — Tenant DB + Provisioning       [Complete / Steps 1–8]│
│  Neon DB per merchant, BullMQ provisioner, tenant middleware     │
│  event.context.adapter bound per request                        │
└─────────────────────────────────────────────────────────────────┘
```

### Request Routing (Phase 2 target state)

```
Incoming request
       │
       ▼
  Fly.io edge
       │
  fly.toml proxy middleware (hostname split)
       │
  ┌────┴────────────────────┐
  │                         │
  ▼                         ▼
app.commercejs.cloud    *.commercejs.cloud
(dashboard process)     (storefront process)
port 3000               port 3001
  │                         │
  │                    tenant middleware
  │                    resolves merchant
  │                    binds adapter
  │                         │
  ▼                         ▼
dashboard UI            SSR storefront pages
/api/merchants/*        /api/storefront/*
/api/auth/*
```

### Custom Domain Flow

```
Merchant: acme  →  subdomain: acme.commercejs.cloud  (always works)
                →  custom domain: shop.acme.com       (after CNAME + cert + Domain row)

Both resolve to same Fly app.
Both serve same API + storefront.
No proxy. No federation.

DNS:  shop.acme.com  CNAME  commercejs-cloud.fly.dev
Cert: issued via fly certs add shop.acme.com
Row:  Domain { domain: 'shop.acme.com', merchantId: '...', verified: true }
```

### Self-Hosted Developer Flow

```
1. Merchant signs up → gets acme.commercejs.cloud + API key cjs_live_xxx

2. Self-hosted storefront config:
   NUXT_COMMERCE_API_BASE=https://acme.commercejs.cloud/api/storefront
   NUXT_COMMERCE_API_KEY=cjs_live_xxx

   nuxt.config.ts:
   commerce: { apiRoutes: false, apiBase: '/api/storefront' }
   // (relative — Nuxt server proxies to remote; no CORS)

3. Merchant deploys to Vercel / their own server → shop.acme.com

4. Optional later: add shop.acme.com to dashboard → CNAME → Fly app
   → same-origin, switch back to apiRoutes: true
   → zero friction migration from self-hosted to fully hosted
```

---

## Implementation Tasks

> Task files are in `tasks/` — see T01–T04 for execution detail.

---

## Lessons Learned (Post-Implementation)

> Fill after completing T01–T04.

### What Went Well
-

### What Could Be Improved
-

### Unexpected Challenges
-

### Recommendations for Future Features
-

---

<!-- META_INFORMATION -->
## Task Status Legend
- 🔴 **Blocked**: Requires external dependency or decision
- 🟡 **Planned**: Ready to implement
- 🟢 **In Progress**: Currently being worked on
- ✅ **Completed**: Done

## Change Log

- **2026-04-15**: Initial plan — strategy agreed in session, research pre-completed, T01–T04 created
- **2026-04-15**: T01 code-complete — 19 route chunks, buyer session util, CORS middleware, storefront error hook. Dashboard builds clean.
- **2026-04-15**: T01 deployed + smoke-tested live. `GET smoke.commercejs.cloud/api/storefront/{products,store}` 200, unknown tenant 404, `/orders` without session 401, `/cart` auto-creates + sets buyer cookie. Commit `4b1207c`. Fly deployment `01KP96D2AT3T63A7JGA19P5SJ5`.
<!-- META_INFORMATION -->
