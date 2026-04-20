# Merchant Admin UI — Follow-up Plan

> **Context**: The merchant-admin plan ([`../merchant-admin/plan.md`](../merchant-admin/plan.md))
> shipped T01–T05 on 2026-04-17 and took every merchant to "can log in, CRUD
> products with images, view + fulfill + refund orders." Its own scope list
> at [plan.md:363](../merchant-admin/plan.md:363) explicitly deferred seven
> items (settings, customers, staff, categories CRUD, inventory, analytics,
> theming). This plan **closes out the merchant-admin scope completely** —
> after T06–T13 land, a merchant has a self-service admin comparable to
> Shopify / Salla at the feature set needed to run a real store on
> CommerceJS Cloud.
>
> **Scope**: Multi-session effort. T06–T13 are the last admin tasks the
> CommerceJS product needs before Step 9 "Self-Service Layer" of the Fly
> migration plan (public signup, billing, plan enforcement). Anything
> after T13 belongs to follow-on plans (transactional emails, billing,
> storefront build-time theming, session analytics, …).

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [x] **Research & Strategy Selection** ✅ Completed (2026-04-18)

* [x] [**T06**: Store Settings](tasks/T06.md) — Status: ✅ Completed (2026-04-19)
* [x] [**T07**: Customers (list + detail, read-first)](tasks/T07.md) — Status: ✅ Completed (2026-04-19)
* [x] [**T08**: Categories CRUD UI](tasks/T08.md) — Status: ✅ Completed (2026-04-19)
* [x] [**T09**: Staff management (local-password)](tasks/T09.md) — Status: ✅ Completed (2026-04-20)
* [x] [**T10**: Inventory inline + low-stock](tasks/T10.md) — Status: ✅ Completed (2026-04-20)
* [x] [**T11**: Analytics expansion](tasks/T11.md) — Status: ✅ Completed (2026-04-20)
* [ ] [**T12**: Storefront theming (CSS custom properties v1)](tasks/T12.md) — Status: 🟡 Planned
* [ ] [**T13**: Audit log / activity feed](tasks/T13.md) — Status: 🟡 Planned — blocked by T09

<!-- END PROGRESS SECTION -->

---

## Research & Strategy Selection

**Status**: ✅ **Completed**

### Goal

Ship every item the parent merchant-admin plan deferred, so the merchant
admin UI on `*.commercejs.cloud/admin` matches the feature set a real SMB
store needs: settings they control, customers they can see, categories they
can CRUD, staff they can add, stock they can adjust, sales they can
analyze, a storefront that looks like their brand, and a record of who did
what. After this plan, there is no "the admin can't do X" gap left in the
merchant-facing surface.

### Context

An Explore pass on `packages/platform/src/admin/` confirmed that most of
the work is pure **HTTP wrapper + UI** — i.e. the T05 shape repeated
several times. The exceptions:

- **Staff management** already has local-password CRUD (`admin.auth.createAdmin`
  / `listAdmins` / `deleteAdmin` / `changePassword`) but no invite-by-email
  flow. The invite flow depends on the transactional-email workstream
  (`handleSendEmail` is a stub in `apps/dashboard/worker.ts`), so it's
  explicitly out of scope for this plan — we ship local-password-only staff
  CRUD now, and the email-workstream plan picks up the invite spillover.
- **Inventory bulk CSV import** would need a CSV parser and a presigned
  upload pipeline. Split out: T10 ships inline adjust + low-stock table
  (the 80% case). Bulk CSV is parked in the Deferred list.
- **Analytics expansion** is the first task that adds *new platform queries*
  (revenue time-series, top products, top customers). Both Prisma and
  Drizzle backends need the queries per the repo's parity rule, and
  `packages/platform/scripts/check-query-parity.sh` must stay green.
- **Storefront theming** is the only task that spans platform + storefront
  + admin. v1 is CSS custom properties injected via a Nitro server plugin
  — Tailwind-preset theming (per-tenant compilation) is explicitly
  deferred as v2.
- **Audit log** was not on the parent's deferred list but is a near-zero-
  effort add on top of T09's multi-staff surface, and without it, every
  "who changed this" question turns into a support ticket. Scope-adjacent
  enough to include here.

### Strategy Proposals

**Option A — Ship all 7 parent-deferred items + audit log in one plan**
- Pros: Closes the merchant-admin scope completely in one effort. Shared
  task-file conventions + smoke acceptance pattern from T05 carry over
  unchanged. No ambiguity about "where does customer management live".
- Cons: Plan is 8 tasks long. Two are Large (analytics, theming). Risk of
  scope drift over the multi-session run.

**Option B — Ship only the "cheap 4" (settings, customers, categories,
staff) as a short closeout, defer analytics + theming + audit to a
separate plan**
- Pros: Ships quickly. Analytics + theming each deserve their own
  well-scoped plan with chart-library + design-token decisions surfaced.
- Cons: Creates a third plan in the merchant-admin workstream when there's
  no architectural reason to split — they all land on the same admin nav,
  same HTTP namespace, same Prisma DB. Scope fragmentation.

**Option C — Reshape as a monolithic "merchant-admin v2" rewrite**
- Pros: Could rationalize the admin UX across all 13 tasks end-to-end.
- Cons: Massive over-scoping for what are independent CRUD surfaces.
  Nothing about T06–T13 needs coordinated architectural design; each is
  just another `/api/admin/*` route + Vue page. Rejected.

### Selected Approach

**Decision**: Option A — one plan, eight tasks, closes merchant-admin
scope completely.

**Rationale**:
- The parent plan's "Out of scope" list at
  [../merchant-admin/plan.md:363](../merchant-admin/plan.md:363) is
  explicitly "follow-up" in a *single* follow-up. Splitting that intent
  into multiple follow-ups fragments the workstream table in grand-plan
  without architectural benefit.
- T05's one-commit-per-task rhythm contains scope drift naturally.
  Eight commits against a well-defined per-task acceptance list is
  manageable.
- Even T11 (analytics) and T12 (theming) are chunked well — each has a
  clear scope boundary (revenue/top rollups for T11; CSS-var injection
  only for T12). Scope-creep risk (Tailwind preset, CSV bulk, conversion
  funnel) is surfaced in the Deferred list rather than left implicit.

**Key Findings**:

- `AdminAPI` on `packages/platform/src/admin/types.ts` already exposes
  the methods needed for T06, T07, T08, T09 (local-password half), and
  T10. Those are pure HTTP + UI.
- `StoreSettings` type is already rich enough for T06 — no platform change.
- `admin.auth.{createAdmin,listAdmins,deleteAdmin,changePassword}` cover
  local-password staff CRUD. A small `status` enum (`'active' | 'invited'
  | 'disabled'`) added in T09 prevents retroactive schema work when
  invites eventually land in the email-workstream plan.
- T11 + T12 + T13 need platform-side work — migrations land in the
  merchant branch DB (via `packages/platform/src/database/prisma/schema/`
  plus the Drizzle sibling), with `check-query-parity.sh` gating.
- The tenant-middleware migration shipped in `01ee8c3` — every new route
  rides `event.context.db` + the registered event resolver.
  Concurrency-safe under multi-tenant traffic from day one. No legacy
  `bindDb()` paths to worry about.
- The admin sidebar in `apps/storefront/app/layouts/admin.vue` lost the
  "Customers" + "Settings" links in `0804c3b` when they 404'd. Each task
  that ships its page restores the matching link.

**Implementation Plan** (high-level):

1. T06 / T07 / T08 ship as three independent Small commits in that order
   — low-risk, mirror-T05 shape, good momentum.
2. T09 ships next with the small `status` enum schema prep to avoid
   retroactive work later.
3. T10 ships whenever convenient (independent).
4. T11 ships before T12/T13 because it's self-contained on the backend
   side — only new queries + new page.
5. T13 ships after T09 so audit events can attribute to a staff actor.
6. T12 ships last — the largest vertical slice, touches platform +
   storefront + admin.
7. Each task: one commit → build/typecheck green → deploy to Fly (with
   explicit user go) → live curl acceptance on smoke.commercejs.cloud.
8. When T13 lands, the workstream flips ✅ in
   `.plans/grand-plan.md`'s Phase 7 table and the merchant-admin scope
   is closed.

---

## Architecture Reference

| Aspect | Decision | Source |
|---|---|---|
| Auth | `requireMerchantSession` on every new admin route | `apps/dashboard/server/utils/merchant-auth.ts` |
| Tenant binding | `event.context.db` via registered event resolver | `apps/dashboard/server/plugins/platform-event-resolver.ts` |
| Zod validation | Schemas appended to `admin-schemas.ts`, parsed via `parseOrThrow` | `apps/dashboard/server/utils/admin-schemas.ts` |
| HTTP layout | `apps/dashboard/server/api/admin/<domain>/...` | T05 precedent |
| UI layout | `apps/storefront/app/pages/admin/<domain>/...`, `layout: 'admin'`, `middleware: 'admin'`, `ssr: false` | T03/T05 precedent |
| UI components | Nuxt UI v4 (`UTable`, `UCard`, `UModal`, `UBadge`, …) | T05 precedent |
| Driver parity | Every new platform query exists in both Prisma + Drizzle + passes `check-query-parity.sh` | `.memory/decisions.md` |
| Tests | Platform queries get vitest unit tests next to existing `admin-orders-guards.test.ts` | T05 precedent |

---

## Implementation Tasks

Task files live in [`tasks/`](tasks/) — see T06–T13 for execution detail.

**Dependency order:**

```
  T06  Settings        (independent)
  T07  Customers       (independent)
  T08  Categories      (independent)
        │
        ▼
  T09  Staff           (adds status enum; enables T13 attribution)
        │
        ├─► T13  Audit log     (depends on T09 for actor attribution)
        │
        ▼
  T10  Inventory       (independent, can ship earlier if needed)
        │
        ▼
  T11  Analytics       (large, new platform queries)
        │
        ▼
  T12  Theming         (largest, spans platform + storefront + admin)
```

---

## Constraints & Check-with-User Gates

- **Follow the T05 commit rhythm.** One task per commit. No "ship all the
  Smalls in one big commit" — even when several Smalls land in a row.
- **Deploy gates are explicit.** Per user preference, `fly deploy`
  requires explicit "go". Build + test + typecheck + local curl are
  autonomous.
- **Platform changes need parity.** T09, T11, T12, T13 each touch the
  platform schema or query layer. Every change lands on both Prisma and
  Drizzle backends; `check-query-parity.sh` must pass before the commit.
- **No scope drift on Deferred items.** If a task grows into a Deferred
  item (CSV bulk, Tailwind preset, email invite, session analytics),
  pause and report — do not fold into the current task's commit.
- **Merchant Neon branch migrations roll out lazily.** New tables/columns
  in T09 / T12 / T13 don't auto-migrate existing merchant DBs — the
  `migratePrisma()` call from the tenant middleware handles it on the
  next request. Verify during each task's smoke acceptance.

---

## Out of Scope (Deferred, with destination plans)

These items came up during research but are explicitly **not** in this
plan. Each has a forward-reference to the plan that owns it.

- **Staff email-invite flow** — depends on the transactional-email
  workstream (grand-plan Phase 7; `handleSendEmail` stub in
  `apps/dashboard/worker.ts`). T09 lays the `status` enum forward-compat
  groundwork; the email-workstream plan eventually ships `sendInvite` /
  `acceptInvite` on top of it.
- **Bulk CSV inventory import** — deferred to a v2 merchant-admin plan
  (unscheduled). Parser + validation + async job. Reuses T04's
  presigned-PUT infra for CSV upload.
- **Tailwind-preset theming** (full custom CSS class injection via
  per-tenant compilation) — deferred to a storefront-theming-v2 plan
  (unscheduled). Needs a storefront build pipeline change.
- **Conversion rate in analytics** — requires session/visitor tracking
  that CommerceJS doesn't currently capture. Deferred to a separate
  analytics-tracking workstream (unscheduled). T11's analytics page
  will render a visible "Conversion rate: not yet tracked" tile to
  signal the gap.
- **Platform categories hardening** (surfaced during T08) — three gaps in
  `packages/platform/src/admin/categories.ts` / `packages/types/src/category.ts`:
  (1) `deleteCategory` only blocks when `findCategoryChildren` is
  non-empty — categories with attached products delete silently,
  orphaning product↔category links. (2) `updateCategory` accepts any
  `parentId` — no check against self-parent or descendant cycles, so the
  tree can be broken by setting A's parent to A (or to a descendant of
  A). (3) `Category` type omits `sortOrder`, so `mapCategory` can't
  return it; T08's list page had to drop the sort column and T08's form
  keeps `sortOrder` as a write-only field. Owner: unscheduled platform-
  hardening follow-up (own plan). Not folded into T09-T13 because those
  are admin-UI scope; fixing these sooner is better but not blocking.
  T08 confirms the UI contract tolerates the current platform behavior.

---

## Lessons Learned (Post-Implementation)

> Fill this section out after completing T06–T13.

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

- **2026-04-20**: T11 Analytics expansion shipped + deployed + all acceptance green
  on smoke.commercejs.cloud. Platform: three new `AdminAPI` methods
  (`getRevenueTimeSeries`, `getTopProducts`, `getTopCustomers`) with Prisma +
  Drizzle queries in parity (151/151 exports green), plus `avgOrderValue` +
  `refundRate` on `DashboardStats` (computed from existing ordersByStatus — no
  new DB round-trips). Zero-fill happens in the domain layer so both drivers
  return the same simple result and charts render without gaps. 14 new unit
  tests cover zero-fill, limit clamping, AOV math, refund-rate edge cases
  (including the T09-T10 admin-orders-guards test pattern). Dashboard: three
  new routes under `apps/dashboard/server/api/admin/analytics/` (all
  `requireMerchantSession`-gated); `analyticsRangeSchema` +
  `topAnalyticsQuerySchema` in `admin-schemas.ts` validate ISO date / ISO
  timestamp inputs up-front. Storefront: `/admin/analytics.vue` with
  date-range dropdown (7d/30d/90d/custom), granularity selector (day/week/
  month), four KPI tiles, inline-SVG revenue bar chart (zero deps — UChart
  doesn't exist in Nuxt UI v4, chart.js would be overkill for one chart),
  top-10 products table (click → `/admin/products/:id/edit`), top-10
  customers table (click → `/admin/customers/:id`), and a muted "Conversion
  rate — not yet tracked" placeholder tile. `/admin/index.vue` automatically
  picks up AOV + refund-rate tiles. Sidebar gets an "Analytics" link between
  Customers and Staff. **Live bug caught + fixed during acceptance**: smoke
  merchant DB has `products.id` as UUID and `order_items.product_id` as TEXT
  (Neon branch provisioned before later migrations normalized the types),
  which crashed `top-products` with `operator does not exist: uuid = text`
  (PG 42883). Patch: `::text` casts on every analytics join key (Prisma +
  Drizzle). Flagged as schema-drift follow-up but resolved inline because
  the admin query path is hot. Acceptance 7/7 on smoke: (1) unauth 401 on
  all three routes; (2) revenue day series returns 20 zero-filled buckets
  for 2026-04-01 → 2026-04-20; (3) revenue week series returns 4 buckets
  with 2703 revenue / 7 orders in the week of 2026-04-13; (4) top-products
  returns 3 real products sorted by revenue (Oud Cologne 1743, Prayer Rug
  796, Arabic Coffee 89); (5) top-customers returns [] (expected — all
  8 smoke orders are guest checkouts); (6) dashboard stats shows
  avgOrderValue 386.14, refundRate 0.125, totalOrders 8, totalRevenue
  2703; (7) invalid granularity=hour → 400, cross-tenant cookie replay
  → 404, storefront `/admin/analytics` → 200. Scope held — no drift
  toward sales-by-category, conversion rate (placeholder instead), or
  chart.js dep. Query parity green (151/151).
- **2026-04-20**: T09 Staff management (local-password) shipped + deployed +
  8/8 acceptance green on smoke.commercejs.cloud. Platform: `admin_users.status`
  column (Prisma + Drizzle + idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS`
  in `migratePrisma`); `AdminUserSafe` gains `status` with a `'active'` fallback
  in `toSafe` for rows that predate the migration; `admin.auth.updateAdmin(id,
  { name?, role? })` added to both the domain and the `AdminAPI.auth` type.
  Last-owner guard bug fix: the pre-existing `deleteAdmin` path counted ALL
  admins (`countAdminUsers()`) so a 1-owner + 1-editor store could delete its
  only owner — switched to a `countOwners()` helper that filters by role, and
  duplicated the check on the role-change path so a CLI script calling
  `updateAdmin` directly can't demote the last owner either. Dashboard:
  tenant middleware now runs `migratePrisma()` on adapter-cache-miss (lazy-
  migrate — applies idempotent schema patches to pre-existing merchant Neon
  branches on first-request-per-process, verified live on smoke where it
  added the `status` column without a manual step); six new routes under
  `apps/dashboard/server/api/admin/staff/` (`index.{get,post}`, `[id].
  {get,patch,delete}`, `[id]/password.patch`); `requireOwner` helper at
  `apps/dashboard/server/utils/require-role.ts` gates write routes; write
  routes check `role === 'owner'`, the password route is scoped to "change
  your OWN password" via `id === session.userId`; `createStaffSchema` +
  `updateStaffSchema` + `changeStaffPasswordSchema` in `admin-schemas.ts`
  (password ≥ 8 chars, role triad enum). Storefront: three new pages under
  `apps/storefront/app/pages/admin/staff/` — list (role + status badges,
  owner-only add/remove, self-delete hidden), new (show/hide password toggle,
  1-tap secure random generator, post-create banner shows the password once
  with a copy button), edit (own-role-change disabled client-side, password-
  change modal self-only). Sidebar gets a "Staff" link between Customers and
  Settings. Smoke acceptance 8/8: (1) owner creates admin → status 'active';
  (2) created staff logs in; (3) non-owner POST → 403 "requires one of:
  owner"; (4) owner self-delete → 400 (self-delete guard fires first with
  "You cannot remove your own staff account" — last-owner guard is the
  safety net); (5) owner demotes only owner to editor → 400 "Cannot remove
  the last owner"; (6) wrong current password → 400 "Current password is
  incorrect"; (7) correct current+new → 200, new works, old rejected; (8)
  cross-tenant cookie replay to `nonexistent.commercejs.cloud` → 404
  "Merchant not found" (tenant middleware blocks before the auth guard).
  Lazy-migrate verified in production: GET /api/admin/staff on smoke
  returned `status:"active"` on the pre-existing owner row, confirming
  `migratePrisma()` ran the `ALTER TABLE` on the existing Neon branch.
  Query parity stayed green (148/148). No scope creep — the T01-review
  `bcrypt.compareSync` carry-over is untouched; categories-hardening items
  stay on the Deferred list.
- **2026-04-19**: T08 Categories CRUD UI shipped. Platform gains a one-liner
  `AdminAPI.getCategory(id)` (wraps existing `findCategoryById` + the
  domain's `mapCategory`). Dashboard restructures the flat
  `api/admin/categories.get.ts` into a directory:
  `categories/index.get.ts` (unchanged `listCategories(parentId?)` —
  consumer URL `/api/admin/categories` is preserved so T03's product form
  dropdown keeps working), `index.post.ts` (`admin.createCategory`),
  `[id].get.ts` (`admin.getCategory`, maps platform "not found" → 404),
  `[id].patch.ts` (`admin.updateCategory`), and `[id].delete.ts`
  (`admin.deleteCategory` — surfaces platform orphan-prevention 4xx
  message so the UI toast can quote it; 404 on /not found/ match, 400
  otherwise). `admin-schemas.ts` gains `createCategorySchema` +
  `updateCategorySchema`; empty `slug`/`parentId` strings transform to
  `undefined` so the platform's slugify-on-create path fires and a blank
  parent stays root. New storefront shared component
  `AdminCategoryForm.vue` (name, nameAr, slug, description, descriptionAr,
  image via T04 presign with `context:'category'`, parent dropdown using
  a `'__root__'` sentinel to dodge Reka UI's empty-string crash,
  sortOrder). Three pages: `/admin/categories/index.vue` (flat UTable
  with name EN+AR, slug monospace, parent, product count, Edit/Delete),
  `/admin/categories/new.vue`, `/admin/categories/[id]/edit.vue` (same
  form, `exclude-id` keeps a category out of its own parent options).
  Sidebar `apps/storefront/app/layouts/admin.vue` gets a "Categories"
  link (tag icon) between Products and Orders. Build green on platform
  + dashboard + storefront. Pending deploy + live acceptance on
  smoke.commercejs.cloud (explicit-go gate). Scope stayed on T08 —
  parent-loop protection + products-attached orphan prevention still
  look unenforced on the platform; flagged as follow-up rather than
  folded into T08.
- **2026-04-19**: T07 deployed to smoke.commercejs.cloud and verified —
  8/8 acceptance scenarios green (list 200 + empty envelope; registered
  a buyer via `/api/storefront/auth/register`, list → total=1; search
  narrows; detail 200 with profile+addresses; delete → 204 + subsequent
  GET → 404; unauth → 401; cross-tenant cookie replay → 404; bogus id →
  404). FK-block path wired but not exercised (no customer-with-orders
  on smoke). Heads-up for future sessions: smoke's 8 pre-existing COD
  orders were all guest checkouts (`customerId = null`, no
  `shippingAddress.email`), so the Customers list only populates once a
  real buyer registers or a COD flow captures an email.
- **2026-04-19**: T07 Customers (list + detail, read-first) shipped. Three
  new dashboard routes under `apps/dashboard/server/api/admin/customers/`
  (`index.get.ts` wraps `admin.listCustomers({ page, perPage, search, sort })`,
  `[id].get.ts` wraps `admin.getCustomer` and maps thrown not-found → 404,
  `[id].delete.ts` wraps `admin.deleteCustomer` — 204 on success, 404 on
  `/not found/`-matching platform errors, 400 otherwise so FK-block reasons
  from customers-with-orders surface in the toast). `listCustomersQuerySchema`
  added to `admin-schemas.ts` (page/perPage/search/sortField/sortDirection).
  Two new storefront pages — `apps/storefront/app/pages/admin/customers/index.vue`
  (debounced search + `UTable` of email/name/phone/joined + `UPagination`,
  mirrors T05 orders list shell) and `.../[id].vue` (four panels: Profile,
  Addresses with default-highlight, Orders via a second useFetch to
  `/api/admin/orders?customerId=:id` linked to existing `/admin/orders/:id`,
  Danger-zone delete with confirm modal that quotes the email + warns about
  FK-block). Muted helper line notes the page is read-only (customer profile
  edits stay on buyer-facing storefront). Sidebar restores the "Customers"
  link between Orders and Settings. No platform API changes. Pending deploy
  + live acceptance on `smoke.commercejs.cloud` (explicit-go gate).
- **2026-04-19**: T06 Store Settings shipped. Three new dashboard files —
  `apps/dashboard/server/utils/admin-schemas.ts` gains
  `updateStoreSettingsSchema` (mirrors `UpdateStoreInput` with
  `z.string().url()` on logo/favicon, `.email()` on contactEmail,
  `.length(3)` on currency, `.or(z.literal(''))` for clearing); two
  thin route wrappers at `apps/dashboard/server/api/admin/settings.{get,patch}.ts`
  wrap `admin.getStoreSettings` / `updateStoreSettings` under
  `requireMerchantSession` + `parseOrThrow`. One new storefront file —
  `apps/storefront/app/pages/admin/settings.vue` renders a grouped form
  (Brand / Locale / Contact / Social) with logo + favicon uploads reusing
  T04's presign flow (`context: 'store-logo'`), social-link asymmetry
  (platform returns `Record<string,string>` → form rows → JSON string
  on PATCH), and the caveat alert that currency/locale changes don't
  retroactively convert product prices. `apps/storefront/app/layouts/admin.vue`
  restores the "Settings" sidebar link (removed in 0804c3b). No platform
  API changes. Pending deploy + 8-scenario live acceptance on
  `smoke.commercejs.cloud` (explicit-go gate).
- **2026-04-18**: Plan created. Research completed (Option A selected);
  eight tasks (T06–T13) defined to close out merchant-admin scope.
  Deferred items documented with forward-references to owning plans.
  Parent merchant-admin plan's Lessons Learned section filled in the
  same commit (session-wide findings: Reka SelectItem empty-value rule,
  Prisma date-bound parsing, platform double-fulfill gap, tenant-
  middleware race window). No code changes yet — planning artefacts only.
