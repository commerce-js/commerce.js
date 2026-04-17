# Merchant Admin UI — Plan

> **Context**: The Fly.io EaaS platform is live (Steps 1–8 complete), storefronts are running at
> `*.commercejs.cloud` (T01–T04 + phase-1 composables shipped, `smoke.commercejs.cloud` seeded and
> browser-verified), but merchants have no way to manage their own stores. This plan covers the
> merchant-facing admin UI — the real gate for onboarding non-technical merchants.
>
> **Scope**: Multi-session effort. T01–T05 below take us to "a merchant can log in, CRUD products
> with images, and see their orders." Settings, staff invites, customer management, analytics, and
> storefront theming are deferred to a follow-up plan.

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [x] **Research & Strategy Selection** ✅ Completed (2026-04-17)

* [x] [**T01**: Merchant auth foundation](tasks/T01.md) — Status: ✅ Completed (2026-04-17)
* [x] [**T02**: Admin shell in apps/storefront](tasks/T02.md) — Status: ✅ Completed (2026-04-17)
* [x] [**T03**: Products CRUD](tasks/T03.md) — Status: ✅ Completed (2026-04-17)
* [x] [**T04**: Image upload (presigned S3)](tasks/T04.md) — Status: ✅ Completed (2026-04-17)
* [ ] [**T05**: Orders list + detail (read-first)](tasks/T05.md) — Status: 🟡 Planned

<!-- END PROGRESS SECTION -->

---

## Research & Strategy Selection

**Status**: ✅ **Completed**

### Goal

Give each merchant a self-service admin UI where their staff can log in, manage their catalog
(products with images), view their orders, and manage their customers — scoped strictly to their
own tenant Neon branch, with no code changes to `@commercejs/cloud` and no control DB migration.

### Context

After the storefront-EaaS plan, every merchant gets a branded storefront at `{sub}.commercejs.cloud`.
But the storefront is empty until someone adds products, and the only way to do that today is a seed
script run by a CommerceJS engineer. Without a merchant admin UI, every merchant is either an empty
storefront forever or requires manual CommerceJS-side provisioning per merchant — neither of which
scales.

The key questions answered in research:

- **Where does merchant-staff auth live?** Control DB vs per-merchant branch.
- **Where do admin pages and admin APIs live?** Piggyback on existing apps, or a new app.
- **How does `/api/admin/*` coexist with the existing `/api/merchants/*` (platform-operator) and
  `/api/storefront/*` (buyer) namespaces?**
- **How do product images get uploaded, stored, and served?**

### Strategy Proposals

**Option A — `MerchantStaff` table on the control DB**
- Pros: Single login entry point (`admin.commercejs.cloud`). Centralized password reset. Agency users (one email, many merchants) are natural.
- Cons: New control DB migration. Weak isolation — staff PII in shared DB. Per-merchant `admin_users` table in platform schema goes unused.

**Option B — Per-merchant `admin_users` on each Neon branch (existing table)**
- Pros: Zero migration. `packages/platform/src/admin/auth.ts` already implements login/CRUD/password-change/seedInitialAdmin. Perfect tenant isolation. Deleting a merchant removes their staff cleanly.
- Cons: Login requires subdomain context (`{sub}.commercejs.cloud/admin/login`). Multi-merchant staff need separate accounts per store. Password reset needs the subdomain.

**Option C — Hybrid (control-DB routing table + per-merchant auth)**
- Pros: SSO-style routing + isolated data.
- Cons: Two tables to keep in sync. Complexity not justified until multi-merchant SSO is a real requirement.

**Hosting options considered**:
- `admin.{sub}.commercejs.cloud` — rejected (deep wildcard DNS not supported).
- `{sub}.commercejs.cloud/admin` — preferred (reuses existing proxy + DNS + certs).
- `app.commercejs.cloud/merchants/:id/*` — rejected (conflates operator + merchant audiences).
- New `apps/merchant-admin` co-supervised process — rejected for v1 (third Node process, heavier Docker, more proxy logic; deferred upgrade path).

### Selected Approach

**Decision**: Option B (per-merchant `admin_users`) + admin pages in `apps/storefront` under
`/admin/**` + admin API in `apps/dashboard` under `/api/admin/**`. Image upload via shared S3
bucket with per-merchant prefix.

**Rationale**:

The architecture is already naturally layered — storefront pages live in `apps/storefront` (port
3001, proxied from dashboard), storefront APIs live in `apps/dashboard` (port 3000). The merchant
admin slots into that exact pattern: admin pages in `apps/storefront/.../admin/**`, admin APIs in
`apps/dashboard/.../api/admin/**`. The tenant middleware already populates
`event.context.admin` (an `AdminAPI` instance) for every merchant-host request — it just needs
`/api/admin` removed from its skip list.

Auth goes on the per-merchant branch because:
1. The `admin_users` table (`packages/platform/src/database/prisma/schema/admin-user.prisma`)
   already exists on every merchant DB.
2. `createAdminAuthDomain()` (`packages/platform/src/admin/auth.ts`) already implements login,
   CRUD, password change, and `seedInitialAdmin()`.
3. The subdomain in the URL (`{sub}.commercejs.cloud/admin/login`) already identifies the
   merchant — no routing table needed.
4. Tenant isolation is perfect — each branch owns its staff.

Bootstrap: on first login, if `admin_users` is empty, seed it from the control-DB row's
`Merchant.email` + `Merchant.passwordHash`. This reuses the sign-up credential as the owner's
first admin account, with no provisioning changes required.

Image upload: shared S3 bucket with `merchants/${merchantId}/` prefix. `@commercejs/storage-s3`
already has a `prefix` config option. Merchants never touch S3 directly — presigned PUT URLs are
issued per-upload by the server with the merchant-scoped prefix baked in, and the browser uploads
directly to S3. Per-merchant buckets are a future enterprise-tier upgrade.

**Key Findings**:

1. **The per-merchant `admin_users` table and full auth domain already exist.** No new schema,
   no new business logic — the work is HTTP wrappers + UI.

2. **`event.context.admin` is already populated by the tenant middleware.** Every route under
   a non-skipped prefix has full access to the `AdminAPI` (products, categories, orders,
   customers, store settings, inventory, dashboard stats) via a single property access. The only
   change needed is removing `/api/admin` from `SKIP_PREFIXES`.

3. **The three-layer pattern fits exactly.** Storefront pages → storefront (:3001). Storefront
   API → dashboard (:3000). Admin pages → storefront (:3001). Admin API → dashboard (:3000).
   Proxy, DNS, and tenant resolution all unchanged.

4. **Two session cookies can coexist on the same host.**
   - `cjs-dashboard-session` — platform operator (DashboardUser) at `app.commercejs.cloud`.
   - `cjs-merchant-session` — merchant staff (AdminUser) at `{sub}.commercejs.cloud`.
   They are scoped to different hosts and cannot collide.

5. **Control DB schema is untouched.** `Merchant.email` + `Merchant.passwordHash` are already
   there and repurposed as the first-login seed source. No new columns, no new tables, no
   migration risk.

**Implementation Plan**:

1. **T01**: Merchant auth foundation — `cjs-merchant-session` utility, `/api/admin/auth/*`
   routes, first-login bootstrap from `Merchant` row, remove `/api/admin` from tenant
   middleware's `SKIP_PREFIXES`, add merchant-auth guard.
2. **T02**: Admin shell in `apps/storefront` — `/admin/login` page, `/admin` layout with nav,
   auth guard middleware, `/admin/index` dashboard using `getDashboardStats()`.
3. **T03**: Products CRUD — list/create/edit/delete pages + `/api/admin/products/*` HTTP
   wrappers over `event.context.admin.{listProducts,createProduct,updateProduct,deleteProduct}`.
4. **T04**: Image upload — `/api/admin/uploads/presign.post.ts` issues scoped presigned PUT URLs
   via `@commercejs/storage-s3`; integrate into product form.
5. **T05**: Orders list + detail — read-oriented first pass with status filter, fulfill/refund
   actions wiring to `admin.fulfillOrder` / `admin.refundOrder`.

### Dependencies

- Tenant middleware populates `event.context.admin` — ✅ done in T04 of storefront-eaas plan.
- `admin_users` Prisma model on every merchant branch — ✅ exists (`packages/platform/src/database/prisma/schema/admin-user.prisma`).
- `createAdminAuthDomain()` login/CRUD/seed — ✅ exists (`packages/platform/src/admin/auth.ts`).
- `createAdminProductsDomain()`, `createAdminOrdersDomain()`, etc. — ✅ all exist under `packages/platform/src/admin/`.
- `@commercejs/storage-s3` provider — ✅ exists (`packages/storage-s3/src/s3-storage-provider.ts`).
- Storefront :3001 is co-supervised and reachable via merchant-host proxy — ✅ done in T04.

### Related Files

- `apps/dashboard/server/middleware/tenant.ts` — skip-list edit, merchant-auth guard integration
- `apps/dashboard/server/utils/tenant.ts` — no changes expected
- `apps/dashboard/server/utils/session.ts` — model for the new merchant-session util
- `apps/dashboard/prisma/schema.prisma` — NO CHANGES in T01–T05 (gated)
- `apps/storefront/app/layouts/` — new admin layout
- `apps/storefront/app/pages/admin/` — new admin pages
- `apps/storefront/app/middleware/` — new admin auth guard (client-side)
- `packages/platform/src/admin/` — reference only (no changes)
- `packages/storage-s3/src/` — reference only (no changes)

---

## Architecture Reference

### Request Flow — `/admin/products` page load

```
Browser: smoke.commercejs.cloud/admin/products
       │
       ▼
  Fly.io edge (wildcard cert, shared Fly app commercejs-cloud)
       │
       ▼
  Dashboard :3000 — 00.storefront-proxy.ts
       │   (path is non-API and host is a merchant subdomain)
       ▼
  Storefront :3001 — SSR renders /admin/products page
       │
       │   page calls $fetch('/api/admin/products?page=1')
       │   (via apps/storefront T02 proxy → relative /api/admin/*)
       ▼
  Dashboard :3000 — /api/admin/products/index.get.ts
       │
       ▼
  tenant.ts middleware
       │   • resolveMerchant(event) via X-Forwarded-Host: smoke.commercejs.cloud
       │   • getPrismaClient(merchant.databaseUrl) + bindDb()
       │   • ensureAdapter() → event.context.admin = AdminAPI
       ▼
  merchant-auth guard (new)
       │   • reads cjs-merchant-session cookie
       │   • 401 if missing / invalid
       ▼
  Handler
       │   return event.context.admin.listProducts({ page: 1, pageSize: 20 })
       ▼
  packages/platform listProducts
       │   • reads ALS-bound Prisma client = smoke's Neon branch
       ▼
  Response: { items: [...], total: N, ... }
```

The critical property: tenant resolution reads the same `X-Forwarded-Host` that the storefront
proxy already injects. The merchant-auth guard runs AFTER tenant resolution so it can compare
the session's merchant ID against `event.context.merchant.id` — an operator can't hijack a
session from merchant A to talk to merchant B.

### Auth Bootstrap Flow — First Login

```
Merchant provisioning (existing)
  • /api/merchants (POST) from onboarding UI creates a Merchant row
  • bcrypt-hashed password stored on Merchant.passwordHash
  • BullMQ job provisions Neon branch + runs Prisma migrations
  • Merchant.status = 'active'
  • admin_users table on the new branch is EMPTY

First merchant login attempt
  • Merchant owner opens smoke.commercejs.cloud/admin/login
  • Submits Merchant.email + password
  • POST /api/admin/auth/login
       │
       ▼
  tenant middleware binds smoke's adapter → event.context.admin
  handler:
       │   • try event.context.admin.auth.login(email, password)
       │   • if "Invalid email or password" → check admin_users count
       │   • if count === 0 → try control DB: Merchant where subdomain=smoke
       │        • if Merchant.email === email AND bcrypt.compare(password, Merchant.passwordHash)
       │          → seed admin_users:
       │            event.context.admin.auth.createAdmin({
       │              email: merchant.email,
       │              password,              // not the hash — createAdmin hashes again
       │              name: merchant.name,
       │              role: 'owner',
       │            })
       │          → retry event.context.admin.auth.login(email, password)
       │        • else → 401 generic "Invalid email or password"
       ▼
  setMerchantSession(event, { userId, merchantId, email, name, role })
  → cjs-merchant-session cookie, host-scoped to smoke.commercejs.cloud

Subsequent logins
  • admin_users.count > 0 → always authenticate against the branch
  • Control-DB fallback is skipped
  • Merchant.passwordHash becomes a read-only backstop for the first-login bootstrap
```

Notes on this bootstrap:
- The control DB password is only consulted if the branch has **zero** admins. Password changes
  on the branch don't propagate to the control DB (and that's fine — the branch is the source of
  truth once an admin exists).
- If the merchant forgets their password before any admin exists on the branch, we have a
  recovery path: reset `Merchant.passwordHash` via the platform operator dashboard and re-trigger
  first login.
- Staff invites (T-later) simply call `admin.auth.createAdmin` on the branch. The control DB is
  never touched.

### Namespace Coexistence

| Namespace | Audience | Session Cookie | Tenant-Scoped? | DB |
|---|---|---|---|---|
| `/api/merchants/*` | Platform operators | `cjs-dashboard-session` | No | Control DB |
| `/api/storefront/*` | Buyers / self-hosted devs | Buyer session or API key | Yes (via subdomain) | Merchant branch |
| `/api/admin/*` | Merchant staff | `cjs-merchant-session` (new) | Yes (via subdomain) | Merchant branch |
| `/api/auth/*` | Platform operators | `cjs-dashboard-session` | No | Control DB |

### Image Upload Flow

```
Merchant admin opens /admin/products/new → attaches hero.jpg
       │
       ▼
  POST /api/admin/uploads/presign
       { filename: 'hero.jpg', mimeType: 'image/jpeg', size: 184320 }
       │
       ▼
  tenant middleware + merchant-auth guard (same as before)
       │
       ▼
  Handler
       │   • reject if !allowed mime / size > max
       │   • key = `merchants/${event.context.merchant.id}/products/${crypto.randomUUID()}/${safeFilename}`
       │   • new S3StorageProvider({ ...config, prefix: '' }).getPresignedUrl({ key, ... })
       │   • return { uploadUrl, publicUrl, key, expiresIn }
       ▼
  Browser PUTs file directly to S3 (no CORS from our origin)
       │
       ▼
  On success, product form stores publicUrl in form state
       │
       ▼
  POST /api/admin/products
       body includes images: [{ url: publicUrl, altText, sortOrder, isPrimary }]
```

S3 secrets needed on Fly (T04):
```
NUXT_S3_ENDPOINT        # e.g. https://s3.us-east-1.amazonaws.com
NUXT_S3_REGION          # e.g. us-east-1
NUXT_S3_BUCKET          # single shared bucket
NUXT_S3_ACCESS_KEY_ID
NUXT_S3_SECRET_ACCESS_KEY
NUXT_S3_PUBLIC_URL      # CDN base, optional
```

---

## Implementation Tasks

Task files live in [`tasks/`](tasks/) — see T01–T05 for execution detail.

Dependency graph:

```
T01 (auth foundation)
  ├─ T02 (admin shell — depends on auth for session cookie + guard)
  │    ├─ T03 (products CRUD — depends on shell for nav + layout)
  │    │    └─ T04 (image upload — depends on product form)
  │    └─ T05 (orders — depends on shell, independent of T03/T04)
```

T02 blocks everything UI. T01 is the unblocker for all session-gated APIs.

---

## Constraints & Check-with-User Gates

### Locked Constraints (do not revisit)

- **Prisma only on fly/eaas.** No Drizzle touches.
- **BullMQ + Upstash Redis for background jobs.** No inline provisioning in request handlers.
- **No `@nuxthub/core`, no Cloudflare-anything.** Nitro preset stays `node-server`.
- **Platform admin API is the backend.** `packages/platform/src/admin/*` already implements all the business logic. T01–T05 are HTTP wrappers + UI, not new domain code.
- **Do NOT change the control DB schema in T01–T05.** If multi-merchant SSO requires a `MerchantStaff` table later, that's a v2 concern with its own plan.
- **Admin pages live in `apps/storefront`. Admin APIs live in `apps/dashboard`.** Do not create `apps/merchant-admin` in this plan — deferred upgrade.

### Check with User Before

- **Committing anything.** Single-commit rhythm per feedback memory — test live → deploy → commit.
- **Running `fly deploy` or `fly secrets set`.** Every deploy needs explicit approval. Secrets list for T04 must be confirmed before `fly secrets set`.
- **Any destructive DB operation.** Prisma `migrate reset`, dropping tables, purging data.
- **Creating a new published package** (e.g. `@commercejs/merchant-admin`). Current plan keeps everything inside existing apps — a new package is a scope change.
- **Changing control DB schema.** The plan explicitly forbids this in T01–T05. If discovered mid-task, stop and escalate.

---

## Next Steps (2026-04-17)

T01 is the entry point — everything else is session-gated. Recommended order:

1. **T01** — Merchant auth foundation. Deliverable: `curl -i -X POST smoke.commercejs.cloud/api/admin/auth/login -d '{"email":"...","password":"..."}'` returns 200 with a `cjs-merchant-session` cookie, and subsequent `/api/admin/auth/session` returns the user.
2. **T02** — Admin shell. Deliverable: `smoke.commercejs.cloud/admin` redirects to `/admin/login` if unauth, and shows a dashboard page if authed.
3. **T03** — Products CRUD. Deliverable: full list/create/edit/delete round-trip against `event.context.admin`.
4. **T04** — Image upload. Deliverable: product form can attach an image that ends up in S3 under `merchants/${id}/products/...` and renders on the storefront.
5. **T05** — Orders read + actions. Deliverable: orders list, detail view, fulfill with tracking, refund.

Out of scope for this plan (follow-up):

- Store settings (logo, currency, locale, contact) page
- Customer list / detail
- Staff invite / management
- Categories CRUD (can be inlined into product form for v1 — simple dropdown of existing rows)
- Inventory bulk operations
- Analytics / reporting beyond `getDashboardStats()`
- Storefront theming / appearance settings

---

## Lessons Learned (Post-Implementation)

> Fill this section out after completing T01–T05.

### What Went Well
- [TBD]

### What Could Be Improved
- [TBD]

### Unexpected Challenges
- [TBD]

### Recommendations for Future Features
- [TBD]

---

<!-- META_INFORMATION -->

## Task Status Legend

- 🔴 **Blocked**: Requires external dependency or decision
- 🟡 **Planned**: Ready to implement
- 🟢 **In Progress**: Currently being worked on
- ✅ **Completed**: Done

## Change Log

- **2026-04-17**: T04 image upload shipped. Storage backend is Fly Tigris
  (S3-compatible; `fly storage create --name commercejs-cloud-assets` auto-
  injected `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_ENDPOINT_URL_S3`/
  `AWS_REGION`/`BUCKET_NAME` as Fly secrets, and `fly storage update
  --public` made the bucket publicly gettable — Tigris rejected
  `PutBucketPolicy` with NotImplemented, so prefix-scoped public-read is
  deferred to a provider-level capability). New
  `/api/admin/uploads/presign.post.ts` behind `requireMerchantSession` —
  Zod-validated body (filename/mimeType/size/optional context),
  mime allow-list (jpeg/png/webp/gif → 400), 10 MB cap (413), key composed
  server-side as `merchants/${merchant.id}/${context ?? 'product'}/${uuid}/
  ${safeFilename}`; client body never supplies prefix so cross-tenant
  presign is impossible by construction. 15-minute presign expiry,
  `Content-Type` carried into the SigV4 signature. New
  `server/utils/s3.ts` — `getS3Config()` reads Fly-native `AWS_*` env
  vars directly via `process.env` (same pattern as
  `NEON_CONTROL_DB_URL` in `utils/db.ts`), throws a clear 500 listing
  missing vars if unconfigured; `publicUrlForKey()` mirrors the provider's
  virtual-hosted URL math. `AdminProductForm.vue` gained an Images card —
  drag-drop zone + file picker, previews in a 2/3/4-col grid, per-image
  alt-text, star-icon "Set primary" button, up/down reorder, trash delete,
  and auto-primary on first upload. `useAdminProductForm.ts.toPayload()`
  now maps `form.images` into the `images[]` payload (re-indexed
  `sortOrder`; falls back to index-0 primary if none marked).
  `@commercejs/dashboard` gained `@commercejs/storage-s3` workspace dep.
  Also: fixed an upstream bug in `@commercejs/storage-s3` —
  `getPresignedUploadUrl`/`getPresignedDownloadUrl` were appending
  `X-Amz-Expires` to the URL AFTER calling aws4fetch's `sign()`, which
  invalidated the signature (aws4fetch defaults to 86400 internally when
  missing at sign time). Fixed by setting `X-Amz-Expires` on the URL
  before signing. Bucket CORS applied via an ad-hoc aws4fetch-based
  node script (removed after use); Tigris CORS rejects wildcard-subdomain
  origins (`https://*.commercejs.cloud` → preflight 403), so the rule
  settled on `AllowedOrigin: *` + `PUT/GET/HEAD` + `*` headers — acceptable
  because writes require a presigned URL and reads are already
  bucket-public. 6/6 smoke acceptance scenarios green on
  `smoke.commercejs.cloud`: presign happy path, mime reject, size reject,
  cross-tenant prefix isolation (enforced by handler, verified via path-
  traversal + context-injection attempts), full PUT → public-GET cycle,
  CORS preflight.

- **2026-04-17**: T03 products CRUD shipped. Dashboard gained
  `/api/admin/products/{index.get,index.post,[id].get,[id].patch,[id].delete}`
  and `/api/admin/categories.get` — all guarded by `requireMerchantSession` and
  backed by `event.context.admin`. Zod schemas in
  `apps/dashboard/server/utils/admin-schemas.ts` parse body + query at the
  route boundary via `parseOrThrow()`. Platform gained `admin.listCategories()`
  on the `AdminAPI` + a `status` filter on `admin.listProducts()` (parity'd in
  Prisma and Drizzle `findAllProducts` / `adminListProducts`). `Product` type
  gained optional `status` + `inventoryQuantity` fields so the admin list UI
  can render them without a separate shape. Storefront's `/admin/products`
  stub replaced with three new pages — `pages/admin/products/index.vue` (list
  with debounced search, status filter, server pagination, UTable with image
  thumb, edit/delete row actions, delete confirm modal), `pages/admin/products/new.vue`
  (create form with "Save as draft" / "Save and publish"), and
  `pages/admin/products/[id]/edit.vue` (same form pre-filled, delete action).
  Shared `components/AdminProductForm.vue` covers basics / pricing / inventory
  / organization / attributes; variants render read-only if present. Prices
  rendered via `usePrice` + `useStoreInfo` — no hardcoded currency.
- **2026-04-17**: Plan created. Research completed in a single session — decisions locked in
  from the prior trade-off analysis (auth = per-merchant `admin_users`, hosting = `/admin/**`
  in storefront + `/api/admin/**` in dashboard, namespace = `/api/admin/*` reusing tenant
  middleware, image upload = shared S3 bucket with per-merchant prefix). T01–T05 task stubs
  created; implementation deferred to next session.
- **2026-04-17**: T02 admin shell shipped. New files in `apps/storefront/app/`:
  `composables/useMerchantSession.ts` (client-side session reader + logout
  wrapped around `/api/admin/auth/*`), `middleware/admin.ts` (named route
  middleware — CSR-only, redirects unauth'd `/admin/**` to `/admin/login`),
  `layouts/admin.vue` (sidebar nav + header with store name, user email,
  sign-out), `pages/admin/login.vue` (centered form, no layout, generic
  401 error), `pages/admin/index.vue` (dashboard landing — 5 stat cards,
  orders-by-status breakdown, recent-orders mini-table, all from
  `getDashboardStats()`), `pages/admin/products.vue` (stub: "Coming in T03").
  New `apps/dashboard/server/api/admin/stats.get.ts` — thin wrapper around
  `event.context.admin.getDashboardStats()` behind `requireMerchantSession`.
  Admin pages are `ssr: false` because the storefront Nitro has no
  `/api/admin/*` proxy (the module's remote-mode proxy only covers
  `/api/storefront/*`); browser-origin `/api/admin/*` calls hit the dashboard
  directly via the existing storefront-proxy rule that keeps `/api/*` on
  `:3000`. Storefront + dashboard builds both green. T03 (products CRUD)
  is the next unblocked task.
- **2026-04-17**: T01 merchant auth foundation implemented. New
  `apps/dashboard/server/utils/merchant-session.ts` (sealed h3 cookie,
  `cjs-merchant-session`, host-scoped), `utils/merchant-auth.ts`
  (`requireMerchantSession(event)` with cross-tenant replay check), and three routes:
  `/api/admin/auth/{login.post,logout.post,session.get}.ts`. Login handler includes the
  first-login bootstrap — if the merchant's branch has zero `admin_users` rows, it seeds the
  `owner` row from the control-DB `Merchant.email`/`passwordHash`. Removed `/api/admin` from
  tenant middleware's `SKIP_PREFIXES` so `/api/admin/*` routes now get tenant resolution +
  `event.context.admin`. Dashboard build green. T02 (admin shell + `requireMerchantSession`
  wired into first guarded route) is the next step.
- **Pre-production carry-over (flagged from 2026-04-17T1800 checkpoint)**: dashboard's
  tenant middleware still uses the legacy `bindDb()` + `initPrisma()` fallback path for
  merchant Prisma client resolution. The hosted-checkout app already uses the new per-event
  pattern (`registerEventResolver()` + `event.context.db` — shipped in commit `7d3d5af`).
  Now that T01 activates `/api/admin/*` through the same dashboard middleware, the legacy
  path is race-prone under **concurrent different-merchant traffic**. Fine for smoke /
  single-merchant development — not fine for production multi-merchant traffic. Fix lives in
  its own focused commit after merchant-admin is shipped end-to-end: migrate
  `apps/dashboard/server/plugins/` to register the resolver, update
  `apps/dashboard/server/middleware/tenant.ts` to set `event.context.db` per request, and
  verify `ensureAdapter()` no longer relies on `initPrisma()`'s module-level `_db`. Scope-
  matched to how hosted-checkout did it. Do NOT fold this into merchant-admin tasks — it's a
  platform-wide fix that the storefront-EaaS plan also benefits from.
<!-- META_INFORMATION -->
