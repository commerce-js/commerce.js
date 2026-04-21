# EaaS Launch — Closing Plan

> **Context**: Merchant-admin-followup closed 2026-04-20. With the admin UI
> scope done, what remains before CommerceJS Cloud can open public signup
> is: (1) the platform-polish backlog accumulated across T01–T13,
> (2) transactional emails (order confirmations, password reset, staff
> invite, trial-ending), (3) Tap subscription billing for merchant SaaS
> plan charges, (4) Step 9 of the Fly migration plan — self-service
> signup + plan enforcement, and (5) the `fly/eaas → main` branch-swap
> so `main` reflects the live production code. This plan groups those
> five workstreams into a single closing roadmap, establishes the
> critical-path order (emails → billing → signup), and folds in every
> open carry-over from earlier phases.
>
> **Scope**: Multi-session effort, likely 3–5 weeks end-to-end. The two
> big workstreams (T02 emails + T03 billing) will each spawn their own
> sub-plan (`.plans/transactional-emails/plan.md`, `.plans/tap-billing/
> plan.md`) when they start — this document is the master roadmap that
> tracks status + captures dependencies. T01 (polish) and T05 (branch-
> swap) are self-contained one-to-two-commit tasks and live entirely
> in this plan's tasks directory.
>
> **Success criteria**: A stranger can hit `app.commercejs.cloud`, sign
> up for a paid plan, pay via Tap, receive a welcome email, verify
> their email, land on a provisioned `*.commercejs.cloud` storefront
> with admin access — and `main` on GitHub reflects the code running
> in production.

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [ ] **Research & Strategy Selection** ✅ Completed (2026-04-20)

* [x] [**T01**: Platform polish](tasks/T01.md) — Status: ✅ Completed (2026-04-20) — 6 items cleared in a single bundle commit
* [ ] [**T02**: Transactional emails](tasks/T02.md) — Status: 🟢 In Progress — sub-plan T01 (staff-invite vertical slice) code-complete on `fly/eaas` 2026-04-21 (commits `d4b68e2` → `5df66eb`), blocked on operator SMTP pre-reqs before smoke acceptance. Sub-plan at [`.plans/transactional-emails/`](../transactional-emails/plan.md); gates T03 + T04
* [ ] [**T03**: Tap subscription billing](tasks/T03.md) — Status: 🟡 Planned — blocked by T02
* [ ] [**T04**: Step 9 self-service signup](tasks/T04.md) — Status: 🟡 Planned — blocked by T02 + T03
* [ ] [**T05**: `fly/eaas → main` branch-swap](tasks/T05.md) — Status: 🟡 Planned — blocked by T01–T04

<!-- END PROGRESS SECTION -->

---

## Research & Strategy Selection

**Status**: ✅ **Completed**

### Goal

Lay out the critical path from today (merchant-admin ✅) to public
launch of CommerceJS Cloud (self-serve signup, paid plans, verified
emails, production on `main`). Every remaining item from the carry-over
list gets a task home. After T01–T05 land, the EaaS pipeline has no
remaining must-ship gaps — anything after is growth/polish, not
launch-blocking.

### Context

An audit of `.memory/checkpoint.md` + `.plans/grand-plan.md` carry-overs
surfaced five distinct workstreams:

- **Platform polish** — a bundle of technical debt with no plan home:
  USelect sentinel helper (four consumers deep — T08, T13, T12-fix,
  T03 status filter), `bcrypt.compareSync → compare` async fix on
  `packages/platform/src/admin/auth.ts` (event-loop blocker from T01
  review), three platform-categories gaps surfaced during T08
  (silent orphaning on deleteCategory, no self-parent/descendant
  cycle check on updateCategory, Category type omits sortOrder),
  T13 "deleted" chip UX polish (orphan-actorId detection), smoke
  merchant Neon branch schema drift (products.id=UUID vs
  order_items.product_id=TEXT — currently absorbed via `::text`
  casts), and the unreleased `@commercejs/storage-s3 v0.2.1`
  changeset from T04. None of these block each other; all are small.
- **Transactional emails** — `handleSendEmail` stub in
  `apps/dashboard/worker.ts` has been parked since the worker shipped.
  `@commercejs/notification-resend` is already a published provider
  package, so the scope is "wire the stub + templates + BullMQ jobs,"
  not "pick a provider." Unblocks T09's deferred email-invite flow
  (still not shipped), gates Tap billing (trial-ending + receipts),
  and gates self-service signup (welcome + verify).
- **Tap subscription billing** — no plan doc yet.
  `Merchant.tapCustomerId` column is already plumbed on the control
  DB. Scope includes plan-tier definitions, Tap subscription creation,
  webhook handling for payment events, dunning/retry on failed charges,
  and admin UX (view current plan, upgrade/downgrade, invoices). Tap
  payment SDK is already wired on `apps/hosted-checkout` for commerce
  card payments — reuse the same token/webhook plumbing.
- **Step 9 self-service signup** — documented in
  `.plans/fly-migration-plan.md` but not scoped as tasks. Covers the
  public-facing `app.commercejs.cloud/signup` flow: form → Tap
  subscription → email verify → Neon branch provision (reuses the
  existing worker) → first-login redirect to new storefront's admin.
  Requires both T02 (verify email) and T03 (plan charge).
- **`fly/eaas → main` branch-swap** — divergence has accumulated
  throughout Phase 7. At some point `fly/eaas` becomes the source of
  truth for production and `main` (Cloudflare) is either archived or
  hard-reset. Low-risk technically; high-risk politically if any
  external consumers still track `main`. Runbook-style task, not a
  multi-commit workstream.

### Strategy Proposals

**Option A — One master plan, five tasks, emails-first critical path**

- Pros: Single place to track remaining pre-launch work. Dependencies
  are explicit (emails gates billing gates signup). Large tasks
  (T02, T03) spawn their own sub-plans when they start, so this master
  plan stays orientation-level. Matches the merchant-admin ↔
  merchant-admin-followup hand-off pattern that's already worked
  twice in this repo.
- Cons: Mixes technical-debt polish with feature workstreams in one
  plan; task sizes are very different (T01 is ~1 day, T03 is weeks).

**Option B — Polish + branch-swap as backlog items in CLAUDE.md or
`.memory/checkpoint.md`; only plan the three big features**

- Pros: Plans stay single-theme; polish items end up in carry-over
  lists where they naturally live.
- Cons: Three separate new plans (emails, billing, signup) with no
  master tracker for dependencies. Polish items have been in
  carry-over lists for weeks without getting picked up — the carry-
  over format isn't driving work. A dedicated T01 with a deadline-like
  status forces them into a commit.

**Option C — Merge transactional emails into the billing plan (both
touch subscriptions), signup into its own plan, polish into a
separate "platform polish" plan**

- Pros: Emails + billing share the BullMQ worker surface; co-locating
  their plans avoids duplication.
- Cons: Emails are used by more than billing (staff invites, order
  confirmations, password reset). Coupling them to billing artificially
  narrows the emails workstream. Rejected.

### Selected Approach

**Decision**: Option A — one master plan at `.plans/eaas-launch/`,
five tasks (T01 polish, T02 emails, T03 billing, T04 signup, T05
branch-swap), emails-first critical path.

**Rationale**:
- Merchant-admin + merchant-admin-followup proved that a two-plan
  pattern (master + followup) scales up to 13 tasks. The same pattern
  handles 5. No architectural reason to split further.
- The polish items need a hard commitment to land. Six months of
  carry-over lines haven't produced commits; a T01 with a Planned
  status will. It's also small enough (one working day) that bundling
  it doesn't bloat the plan.
- Emails-first matches the already-established recommendation — it's
  the smallest of the three features AND unblocks both of the larger
  ones. T03 + T04 can proceed in parallel after T02 if capacity allows,
  but the default serial order is safer.
- The branch-swap logically comes last — waiting until every launch-
  blocking workstream has shipped means one cutover, not five.

**Key Findings**:

- `@commercejs/notification-resend` exists as a published provider —
  T02 does NOT need to pick an email SaaS from scratch. Provider
  interface is already defined; templates + BullMQ wiring are the
  real work.
- `Merchant.tapCustomerId` is on the control DB schema. T03 doesn't
  need a migration to start.
- `apps/hosted-checkout` already integrates the Tap SDK for commerce
  payments. T03 can reuse the token handling + webhook verification
  patterns from that codebase. The new surface is subscriptions, not
  one-off charges.
- `.plans/fly-migration-plan.md` § Step 9 documents the signup flow
  at an architectural level. T04 translates that into merchant-admin-
  style task decomposition + code.
- The USelect sentinel helper is the most immediate polish item —
  whatever admin task comes next (settings extensions, billing admin
  UX, etc.) will want it on day one. Ship it in T01 before T03's
  admin UX lands.
- `@commercejs/storage-s3 v0.2.1` is a one-command `pnpm release`
  away. It's on the list because the changeset file sits unreleased,
  not because there's more work. Smallest possible polish item.

**Implementation Plan** (high-level):

1. **T01 polish first** (any session) — independent, clears the
   carry-over backlog, ships the USelect helper before T03 wants it.
   Single 1–2-day commit bundle.
2. **T02 emails second** — spawns `.plans/transactional-emails/
   plan.md` with its own T01–T0N. Unblocks T09's invite flow (ship as
   the first vertical slice to validate the pattern), then order
   confirmations, password reset, and trial-ending scaffolding.
3. **T03 billing third** — spawns `.plans/tap-billing/plan.md`.
   Defines plan tiers + pricing, wires Tap subscription create/update/
   cancel, handles subscription webhooks (active/past_due/cancelled),
   adds admin UX for plan + invoice view. Verifies against T02's email
   receipts.
4. **T04 signup fourth** — lives entirely in this plan (T04.md has
   full specs; won't spawn a sub-plan). Builds on T02 (verify email)
   and T03 (first-charge). Translates fly-migration-plan.md Step 9
   into a merchant-admin-style flow.
5. **T05 branch-swap last** — runbook task. After T01–T04 have all
   shipped + acceptance-verified on smoke, cut `main` over to the tip
   of `fly/eaas`, update CI config, archive or force-reset, update DNS
   defaults, update `CLAUDE.md` to drop the two-branch guidance.

**Parallelization opportunity**: T01 (polish) can ship alongside T02
(emails) if a second session is available. T04 (signup) UI work can
start before T03 (billing) is fully done — the Tap call is the only
hard coupling. Serial order below is the default for one-session-at-
a-time discipline; explicit parallel runs are fine.

---

## Architecture Reference

| Aspect | Decision | Source |
|---|---|---|
| Email provider | SMTP via `@commercejs/notification-smtp` (nodemailer-backed); SMTP service target chosen in sub-plan T01 | `packages/notification-smtp/`, [`.plans/transactional-emails/`](../transactional-emails/plan.md) |
| Email queue | BullMQ job on Upstash Redis; handler in `apps/dashboard/worker.ts` | `apps/dashboard/worker.ts` handleSendEmail stub |
| Email templates | Co-located next to the dispatcher (likely `apps/dashboard/server/emails/*.ts` or a new package — decide in T02) | TBD in T02 sub-plan |
| Billing provider | Tap Payments (subscription APIs, not one-off charge APIs) | Reuses `apps/hosted-checkout` patterns |
| Signup provisioner | Existing `merchant-provisioner.ts` — already creates Neon branch + admin_user + storefront | `apps/dashboard/server/utils/merchant-provisioner.ts` |
| Plan tiers | Control DB (new table or enum — decide in T03) | TBD in T03 sub-plan |
| Branch policy post-swap | `fly/eaas` archived; `main` tracks Fly.io production; Cloudflare code deleted | `CLAUDE.md` needs update in T05 |

---

## Implementation Tasks

Task files live in [`tasks/`](tasks/). Large tasks (T02, T03) spawn
their own sub-plan directories when they start — the corresponding
task file becomes a pointer in that case.

**Dependency order:**

```
  T01  Polish          (independent, ship first or in parallel)
        │
        │
  T02  Emails          (independent; gates T03 + T04)
        │
        ├──────────────┐
        ▼              ▼
  T03  Billing     T04  Signup (UI)
        │              │
        └──────┬───────┘
               │ (T04 Tap-call integration needs T03)
               ▼
            T04 final
               │
               ▼
  T05  Branch-swap    (gates: all of T01–T04 shipped + deployed)
```

---

## Constraints & Check-with-User Gates

- **T02 + T03 spawn sub-plans.** When starting either, the first
  session's first action is to create `.plans/transactional-emails/
  plan.md` or `.plans/tap-billing/plan.md` following the
  merchant-admin-followup structure. The task file in this plan then
  serves as the pointer + status-tracker.
- **Deploy gates stay explicit** per user preference. `fly deploy`
  requires explicit "go"; build + test + typecheck + local curl are
  autonomous. Same as T01–T13.
- **Tap keys are production-sensitive.** Whatever test harness T03
  uses must NOT call live Tap APIs from CI. Sandbox-only. Coordinate
  with user before any merchant-side test charge on smoke.
- **Branch-swap is a one-shot destructive op.** T05 requires explicit
  "go" before any `git push --force` or `main` reset. Runbook must be
  reviewed + signed off.
- **Email delivery is a side effect on real users.** Smoke-merchant
  email address (`qa@smoke-test.local`) doesn't route; any test
  sending to a real address needs a feature flag or a seed-merchant
  with a dev inbox.
- **Platform changes still need parity.** T03 will likely touch the
  control DB schema (plan tiers, subscription status). No change —
  `check-query-parity.sh` is only relevant to the platform package's
  merchant-DB queries, not the control DB. Control DB is Prisma-only.

---

## Out of Scope (Deferred, with destination plans)

These items came up during research but are explicitly **not** in this
plan. Each has a forward-reference.

- **Usage-based billing / metered plans** — T03 ships flat-rate plan
  tiers only. Metered pricing (e.g. per-order fees) is v2 and would
  spawn a separate `.plans/usage-billing/` plan.
- **Multi-currency billing** — T03 ships merchant charges in a single
  currency (likely SAR for the Bahrain region). Multi-currency needs a
  Tap setting + FX handling; deferred.
- **Refund UI for merchant-plan charges** — out of scope for T03.
  Stripe/Tap console handles this manually for v1.
- **Email analytics (open/click tracking)** — T02 ships transactional
  only; analytics is v2 (`.plans/email-analytics/` TBD).
- **Cross-merchant audit log for platform operators** — T13 shipped
  per-merchant audit. Platform-operator-facing audit (dashboard sees
  all merchant actions) is a separate plan.
- **Role-restricted activity log reads** — T13 has all-staff read.
  Owner-only view = one-line `requireOwner` swap; spawn as a small
  task if a merchant asks.
- **The "real" USelect sentinel-helper library** — T01 ships a local
  `apps/storefront/app/composables/useSelectSentinel.ts`. Promoting
  to `@commercejs/ui` as a reusable headless widget is deferred.
- **Custom domains UI for merchants** — the control DB has a `domains`
  table but there's no merchant-facing UI to claim a custom domain.
  Deferred to a `.plans/custom-domains/` plan.
- **Tests that hit live Tap production API** — deferred indefinitely.
  Never in scope.
- **`main` branch preservation as a "legacy Cloudflare" reference** —
  T05 either archives or force-resets. Option-space decided in T05's
  task file, not here.

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

- **2026-04-20**: T01 live acceptance on smoke.commercejs.cloud (curl
  via `SMOKE_MERCHANT_EMAIL` / `SMOKE_MERCHANT_PASSWORD` in `.secrets`).
  Baseline + 6 scenarios green via API: bcrypt login 657ms warm US→FRA
  (no regression); category products-attached guard → 400 "it has 4
  attached products"; self-parent guard → 400; descendant-cycle guard
  → 400; sortOrder surfaced on GET /api/admin/categories + nested
  `product.categories[].sortOrder`; orphan actorId (Alice, deleted
  after T13) confirmed present in /api/admin/activity, chip render
  logic trivially covered by the `!ev.actorId || isOrphanActor(ev)`
  template change. Scenarios not exercisable here: (7) no null-actor
  rows on the current dev DB, code path preserved (OR-extended only);
  (8) browser-only console-error sweep across admin pages — pending
  owner verification; (9) `npm view @commercejs/storage-s3 version`
  still 0.2.0, publish gated on CI from a release-capable branch
  (rides T05 branch-swap). **One gap surfaced + fixed inline**:
  `apps/dashboard/server/api/admin/categories/[id].patch.ts` was
  returning 500 instead of 400 for the new platform guard throws —
  sibling `[id].delete.ts` had the try/catch wrapper but PATCH
  didn't. Fixed + redeployed as commit `528867a`; rerun of scenarios
  3 + 4 confirms clean 400 with the platform's message preserved.
  T01 Execution Summary in `tasks/T01.md` updated with the full
  acceptance table + follow-up note.
- **2026-04-20**: T02 sub-plan spawned at `.plans/transactional-emails/`.
  Research completed (Option A — vertical slices per task, staff-invite
  first). Seven sub-tasks defined (T01 provider wiring + staff invite;
  T02 password reset admin + buyer; T03 order confirmation; T04 welcome;
  T05 email verification; T06 trial-ending with new BullMQ repeatable-job
  infra; T07 retrofit sweep). T01 sub-task file spawned alongside the
  master with the first-vertical-slice scope (end-to-end pipeline proof
  on the T09-deferred staff-invite flow). Provider decision: SMTP via
  `@commercejs/notification-smtp` (keeps existing `SMTP_*` env-var
  shape from the stub — no secrets reshuffle). SMTP service target
  (SES SMTP / Mailgun / Postmark / Resend-SMTP / self-hosted) decided
  in sub-plan T01. Operator pre-reqs called out (SMTP service chosen,
  credentials provisioned, DKIM/SPF/DMARC on `commercejs.cloud`,
  `fly secrets set SMTP_*`). T02 row here flips 🟡 Planned → 🟢 In
  Progress. `T02 → 🟢`.
- **2026-04-20**: T01 platform polish shipped in a single bundle commit
  (`beea6d9`). Six items cleared: USelect sentinel helper (new composable
  + 4 consumers converted), bcrypt sync → async, categories hardening
  (delete-with-products guard, updateCategory cycle guard, Category type
  gains required `sortOrder` with 8 mappers updated + T08 list page
  adopts the Sort column), T13 "deleted" chip now detects orphan
  actorIds, storage-s3 v0.2.1 changeset verified (publish remains gated
  on CI / branch-swap — not runnable from fly/eaas). 10 new unit tests;
  294/294 monorepo tests green; query parity 153/153. Deploy + live
  acceptance deferred until the user says go — smoke cadence per T01.md
  "Test Scenarios". `T01 → ✅`.
- **2026-04-20**: Plan created. Research completed (Option A selected);
  five tasks (T01–T05) defined to close out the EaaS pre-launch scope.
  Master plan at `.plans/eaas-launch/`; T02 + T03 will spawn sub-plans
  when started. Folded in every open carry-over from
  `.memory/checkpoint.md` and `.plans/grand-plan.md` State Snapshot.
  No code changes — planning artefacts only.
