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

* [ ] [**T06**: Store Settings](tasks/T06.md) — Status: 🟡 Planned
* [ ] [**T07**: Customers (list + detail, read-first)](tasks/T07.md) — Status: 🟡 Planned
* [ ] [**T08**: Categories CRUD UI](tasks/T08.md) — Status: 🟡 Planned
* [ ] [**T09**: Staff management (local-password)](tasks/T09.md) — Status: 🟡 Planned
* [ ] [**T10**: Inventory inline + low-stock](tasks/T10.md) — Status: 🟡 Planned
* [ ] [**T11**: Analytics expansion](tasks/T11.md) — Status: 🟡 Planned
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

- **2026-04-18**: Plan created. Research completed (Option A selected);
  eight tasks (T06–T13) defined to close out merchant-admin scope.
  Deferred items documented with forward-references to owning plans.
  Parent merchant-admin plan's Lessons Learned section filled in the
  same commit (session-wide findings: Reka SelectItem empty-value rule,
  Prisma date-bound parsing, platform double-fulfill gap, tenant-
  middleware race window). No code changes yet — planning artefacts only.
