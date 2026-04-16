# Storefront EaaS Architecture — Plan

> **Context**: The Fly.io EaaS platform (Steps 1–8) is live and provisioning merchant DBs. The next major
> product surface is giving those merchants a storefront. This plan documents the architecture strategy
> and implementation roadmap agreed in the 2026-04-15 session.

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [x] **Research & Strategy Selection** ✅ Completed (2026-04-15)

* [x] [**T01**: Storefront API routes in dashboard app](tasks/T01.md) - Status: ✅ Completed (deployed; live smoke test passed 2026-04-15)
* [x] [**T02**: `@commercejs/nuxt` remote mode](tasks/T02.md) - Status: ✅ Completed (2026-04-15; verified live against `smoke.commercejs.cloud`)
* [x] [**T03**: `apps/storefront` — Fly.io migration](tasks/T03.md) - Status: ✅ Completed (2026-04-15; built + ran locally against `smoke.commercejs.cloud`)
* [x] [**T04**: Hosted SSR as second Fly.io process](tasks/T04.md) - Status: ✅ Completed (2026-04-15; live on Fly.io, `smoke.commercejs.cloud` serves storefront SSR)

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

## Next Steps (2026-04-16)

All four original tasks shipped. Phase-1 composable rewrite shipped (commit `95fcd78`). The storefront is live and styled at `smoke.commercejs.cloud`, but not yet functionally usable because:

1. **Smoke tenant has zero products** — `GET /api/storefront/products` returns an empty list. Without catalog data the cart flow can't be exercised in a browser.
2. **Merchants can't add products themselves** — there is no merchant-facing admin UI yet.

Ranked options for the next session, highest-impact first:

### A. Seed the smoke tenant with sample products (quick — ~30 min)
One-shot script or temporary admin endpoint that uses the platform adapter's `admin.createProduct()` on the smoke merchant's Neon branch. Creates 3–5 products with localized names, prices, and a primary image so the end-to-end add-to-cart → checkout → place-order flow can be verified in a browser. Unblocks visible validation of the phase-1 composable rewrite.

Files likely involved: new `scripts/seed-merchant.ts` that:
- Reads the merchant row from the control DB (`NEON_CONTROL_DB_URL`)
- Opens a Prisma client against `merchant.database_url`
- Imports `@commercejs/platform` `createPlatformAdapter({ connectionString })`
- Calls `admin.createProduct(...)` for each sample
Run locally with `pnpm tsx scripts/seed-merchant.ts smoke`.

### B. Merchant admin UI (the real phase-2 — days)
Merchant-facing dashboard at `app.commercejs.cloud/merchants/:id/...` (or a dedicated host like `admin.${subdomain}.commercejs.cloud`) where merchants log in, add products, view orders, manage customers. Gates every actual merchant onboarding — without it `smoke` and every future merchant is an empty storefront forever.

Approximate scope:
- Auth: merchant-staff session (separate from platform-operator `cjs-dashboard-session`). Probably a `MerchantUser` table on the control DB keyed by merchant_id, or per-merchant tables on the merchant DB.
- Admin routes: `/api/admin/products`, `/api/admin/orders`, `/api/admin/customers`, etc. The platform adapter's `admin` surface already has these — just needs HTTP wrappers.
- UI: product CRUD with image upload (storage provider integration), order list + detail, customer list.
- Storefront namespace reuse: the existing `apps/dashboard` is the platform operator dashboard. Merchant admin is a different audience and probably warrants its own app (`apps/merchant-admin`?) or a merchant-scoped section of the existing dashboard.

### C. Phase-2 composable rewrite (quick — ~2 hours)
Four remaining composables on `useAdapter()`: `useReviews`, `useReturns`, `useWishlist`, `usePromotions`. Each needs:
- Storefront API routes added to T01 (`/api/storefront/reviews`, `/wishlist`, `/returns`, `/promotions/validate`, etc.)
- Composable rewrite to `$fetch(apiBase + '/...')` following the pattern from phase 1

Blocks non-core features but none of the core shopping flow.

### D. Tap billing (medium — ~1–2 days)
Subscription creation on merchant signup, plan-change webhooks, failed-payment → `status='suspended'` handler, billing portal page. Blocks commercial launch; nothing functional hinges on it today.

### E. Infrastructure polish (small — a few hours each)
- Per-tenant SSR cache — add `x-forwarded-host` to Nitro's cache key so SWR can come back without cross-tenant leak. Currently every page is fresh-SSR'd (300ms–2.5s TTFB).
- Early 404 for unknown merchants in the dashboard's `00.storefront-proxy` middleware.
- Custom-domain cert automation — run `fly certs add` when a `Domain` row flips `verified: true`.
- Transactional emails — wire `notification-smtp` into `worker.ts handleSendEmail` stub.

### Recommended path
**A → B**. Seed smoke so the current work is visibly complete, then build the merchant admin UI so the system actually onboards real merchants. C, D, E slot in as smaller items once the onboarding story is real.

---

## Lessons Learned (Post-Implementation)

### What Went Well

- **Layered plan held up.** T01 → T02 → T03 → T04 each shipped without changes to the earlier layers' contracts. The "three-layer model" framing (tenant DB → storefront API → hosted SSR) was correct and each task's scope matched the layer below it.
- **AsyncLocalStorage for X-Forwarded-Host propagation.** `event.context` doesn't survive Nuxt's internal `$fetch` dispatch; AsyncLocalStorage does. Learned the hard way on T04 and the solution generalises to anything that needs per-request context to cross the SSR → local-fetch boundary.
- **Co-supervising dashboard + storefront on one machine (single `[processes].web`, `scripts/start-web.sh`)** beat Fly's native separate-process model for this app. Localhost works; no `.internal` DNS plumbing; one health check covers both halves.
- **Mode-aware `apiBase` + `apiRoutes: false` as the remote-mode signal.** Keyed off a build-time option instead of a runtime env var, which Fly-scoped envs don't see at `nuxt build` time.

### What Could Be Improved

- **Build-time vs runtime env visibility is unintuitive.** T04's first two deploy cycles broke because `NUXT_COMMERCE_REMOTE_API_BASE` is set in `fly.toml [env]` (runtime) but `nuxt build` runs at Docker build. Convention for future work: mode switches must be driven by options in `nuxt.config.ts`, not env vars.
- **Nitro's public-asset handler runs before user middleware for any path pattern the build registered** (e.g. `/_nuxt/**`). Learned after the storefront was deployed unstyled. Generalisable: never assume middleware sees every request — baked-in route handlers win.
- **Prisma 7's strict `env('DATABASE_URL')` resolution** requires a placeholder at `prisma generate` time even when no DB is touched. Bit us on T04; worth a top-level Dockerfile comment.

### Unexpected Challenges

- **Nuxt SWR has no built-in vary-by-host.** Caught `routeRules['/']={swr:3600}` leaking `My Store` content to `nonexistent.commercejs.cloud/`. Disabled page-level SWR; per-tenant cache is future work.
- **Dashboard and storefront both emit `/_nuxt/*`** with different hashes. On the shared-machine deploy the dashboard's public-asset handler 404s the storefront's bundles without falling through to our proxy middleware. Fixed by moving storefront assets to `/_storefront/*`.
- **Nuxt's in-process `$fetch` drops both headers and `event.context`.** Neither `headers` on `proxyRequest` options nor `event.context.xForwardedHostOriginal` survived. AsyncLocalStorage was the only reliable propagation channel.
- **Coupling of composable contract to the API shape.** The pre-T01 composables (cart-ID-in-URL, split shipping/billing endpoints, `useAdapter()` for reference data) were invisible-until-runtime mismatches with T01's session-based shape. Would have been caught sooner with end-to-end integration tests against a real adapter + API pair.

### Recommendations for Future Features

- **Every new storefront API endpoint needs a matching composable in the same PR.** The phase-1 rewrite happened a day after T01 because nobody paired them up; any new `/api/storefront/*` route should land with its consumer composable updated.
- **Per-theme asset namespacing already works.** When multi-theme lands, `/_themes/<name>/_nuxt/*` is the natural next step from today's `/_storefront/*` convention.
- **Product seed data should be part of the provisioner** (optional, opt-in) so a new merchant has a populated storefront on day one. Otherwise every demo requires the "first ship an admin UI" prerequisite.
- **Merchant admin UI is the real phase-2 gate**, not more composable polish. Without it, the system can't onboard real merchants no matter how good the storefront is.

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
- **2026-04-15**: T02 shipped — `@commercejs/nuxt` remote mode. `remoteApiBase` + `apiKey` options, mode-aware `apiBase` default, catch-all proxy at `${apiBase}/**`, `cookieDomainRewrite: ''`, skipped adapter plugin / OpenAPI / `addServerScanDir`. Verified against live smoke tenant and a local echo server (path rewrite, apiKey injection, body passthrough, Set-Cookie forwarding).
- **2026-04-15**: T03 shipped — `apps/storefront` migrated off `cloudflare-pages` to `node-server`. Commerce configured in remote mode, `wrangler.toml` deleted, `merchant-config.ts` Nitro plugin added for boot-time tenant check, `<html lang/dir>` wired via `useStoreInfo` in `app.vue`, `useLocalizedString` now locale-aware. Build green; live verification against `smoke.commercejs.cloud` passed. Known carry-over: `useCart` + 6 `useAdapter()` composables need rework against T01's session-based shape (deferred).
- **2026-04-15**: T04 shipped — hosted SSR as a co-supervised second process inside every web machine. Dockerfile builds both apps, `scripts/start-web.sh` (bash) supervises dashboard:3000 + storefront:3001 side by side, dashboard's `00.storefront-proxy.ts` middleware routes merchant-host traffic to :3001 with X-Forwarded-Host, and a new AsyncLocalStorage-based Nitro plugin in `@commercejs/nuxt` carries the merchant host across Nuxt's in-process `$fetch` boundary so the T02 proxy can re-inject it on upstream calls. Live: `smoke.commercejs.cloud/` returns a merchant-correct SSR page; `app.commercejs.cloud/` still serves the dashboard; `nonexistent.commercejs.cloud/` no longer leaks merchant content. All four layers of the storefront-EaaS plan are now complete.
- **2026-04-16**: Post-T04 follow-up — rewrote `@commercejs/nuxt` composables to match T01's session-based storefront API. `useCart` now hits `/api/storefront/cart{,/items,/items/:id}` (cart ID lives on the buyer session cookie, not client-side). `useCheckout` collapses onto the combined `POST /checkout` (addresses) + `PATCH /checkout` (methods) + `POST /checkout/complete` endpoints with a new `setAddresses({shippingAddress, billingAddress?})` method. `useBrands` and `useLocations` moved off `useAdapter()` to `useFetch(apiBase + '/...')`. Added `/api/storefront/countries` and `/api/storefront/cities` dashboard endpoints so the checkout form's country/city dropdowns populate in remote mode. Consumer edit in `apps/storefront/app/pages/checkout.vue` swaps `setShippingAddress + setBillingAddress` for the combined `setAddresses` call. End-to-end verified via direct API curl; full browser add-to-cart flow pending product seed data in smoke tenant.
- **2026-04-16**: **Next-step A shipped — smoke tenant seeded + browser smoke test green end-to-end.** New `scripts/seed-merchant.ts` (run via `pnpm exec tsx scripts/seed-merchant.ts [subdomain]`) reads `NEON_CONTROL_DB_URL` from `.secrets`, looks up the merchant's Neon branch, and seeds via `@commercejs/platform`: 6 GCC countries (`SA/AE/BH/KW/OM/QA`), a "Featured" category, and 4 localized SAR-priced products (Oud Cologne, Arabic Coffee, Medjool Dates, Prayer Rug). Idempotent — SKUs/codes/slugs are checked before insert. Added `scripts/` as a pnpm workspace and pinned `@prisma/client@^7.6.0` as a scripts-local dep. **Three storefront bug fixes also shipped** (phase-1 follow-ups found during the smoke test): (1) `apps/storefront/app/pages/cart.vue` always calls `refresh()` on mount — previous `if (cartId.value)` gate made direct /cart visits render an empty cart during SSR. (2) `apps/storefront/app/layouts/default.vue` wraps the cart button in `<UChip :show="itemCount > 0">` — Nuxt UI v4 dropped UButton's `:badge` prop so the count was silently ignored. (3) `apps/storefront/app/components/SearchPalette.vue` uses `useProducts(params)` instead of a hardcoded `/api/_commerce/products` path — kills the 404 in the console. Also added `NUXT_PUBLIC_GOOGLE_MAPS_KEY` as a Fly secret on `commercejs-cloud` so the delivery-location map renders in production. Deployed `fly/eaas` with all changes; 4 machines rolled green; full browser smoke (home → product → add-to-cart → /cart → /checkout → COD place-order) passes end-to-end on `smoke.commercejs.cloud`.
<!-- META_INFORMATION -->
