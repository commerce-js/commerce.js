# Checkpoint

> Latest detailed checkpoint: [`.memory/checkpoints/2026-04-20T2247.md`](checkpoints/2026-04-20T2247.md)
> Previous checkpoint: [`.memory/checkpoints/2026-04-20T1815.md`](checkpoints/2026-04-20T1815.md)

## Current Phase

**eaas-launch T01 (platform polish) shipped + deployed + live-accepted
on smoke.commercejs.cloud 2026-04-20.** Three commits on `fly/eaas`:
`beea6d9` (code bundle), `76b71ea` (docs flip), `528867a` (PATCH route
500→400 fix surfaced during acceptance). Two Fly rollouts; all 4
machines green after each. 6 of 9 acceptance scenarios pass via API;
1 pending browser check (scenario 8, Reka console errors); 1 gated on
dev-DB state (scenario 7, no null-actor rows — prod will be clean); 1
gated on release CI (scenario 9, storage-s3 0.2.1 publish — rides
T05 branch-swap). **T02 transactional emails is in flight** — a
parallel session spawned `.plans/transactional-emails/` with 7
sub-tasks and flipped the eaas-launch T02 row 🟡 → 🟢.

## What Just Landed (T01, 2026-04-20)

Three commits on `fly/eaas`:

- `beea6d9` feat(eaas-launch): T01 platform polish — sentinel helper
  + bcrypt async + categories hardening
- `76b71ea` docs(plans): T01 platform polish shipped locally — flip
  eaas-launch plan + grand-plan + checkpoint
- `528867a` fix(dashboard): surface updateCategory cycle guard as 400
  not 500 — follow-up from live acceptance (sibling `[id].delete.ts`
  had the try/catch wrapper, PATCH didn't)

Two Fly deploys; all 4 machines green after each. 6 of 9 scenarios
green via API. Full acceptance table in
[`2026-04-20T2247.md`](checkpoints/2026-04-20T2247.md).

## What Was Built (T01 in a paragraph)

Six carry-over items resolved in a single 17-file commit. New
`useSelectSentinel` composable under `apps/storefront/app/composables/`
wraps Reka's empty-value crash; four consumers converted (products
status, activity actor, activity entityType, categories parent via
AdminCategoryForm) — theme font dropdown deliberately skipped due to
3-mode state machine. bcrypt sync→async across all four call sites in
platform admin auth. Categories hardening: `deleteCategory` now blocks
on attached products, `updateCategory` walks the parent chain and
rejects self-parent + descendant cycles, `Category.sortOrder` promoted
to required number with 8 mappers updated and the T08 list page gaining
a Sort column. T13 "deleted" chip now detects orphan actorIds via a
`liveAdminIds` Set cross-check. Smoke merchant schema drift documented
(Option B — no normalization). `@commercejs/storage-s3 v0.2.1`
changeset verified as the presign X-Amz-Expires fix. 10 new unit tests
(60 admin tests total on the platform package now). 294/294 monorepo
tests green. Query parity 153/153. Full details in
[`.plans/eaas-launch/tasks/T01.md`](../.plans/eaas-launch/tasks/T01.md)
Execution Summary and in
[`.memory/checkpoints/2026-04-20T1815.md`](checkpoints/2026-04-20T1815.md).

## Carry-Overs Into Future Sessions

1. **T01 scenario 8** — browser sweep of `/admin/{products,
   categories/new,categories/<id>/edit,theme,activity}` with devtools
   open, confirm no Reka SelectItem "value cannot be an empty string"
   console errors. Pre-existing pattern motivated the whole composable;
   trusted but not visually verified.
2. **@commercejs/storage-s3 v0.2.1 publish** (T01 scenario 9) — rides
   T05 branch-swap or explicit `pnpm changeset publish` from a
   release-capable branch.
3. **Shared platform-throw → 400 helper** — `[id].patch.ts` 500→400
   gap (commit `528867a`) suggests extracting
   `handlePlatformThrow(err)` to `apps/dashboard/server/utils/` so
   new guards in the platform don't need every consuming route to
   remember the try/catch. Small DX win.
4. **Smoke merchant schema drift** — Option B in place
   (`::text` casts in analytics); dedicated
   `.plans/schema-normalize/` plan if we decide to retire them.
5. **Pre-existing apps/ typecheck debt** — ~36 TS errors across
   storefront + dashboard on unrelated admin pages (h3 resolution,
   `@vueuse/core`, `Image.altText`, `Address.email/name`, ioredis
   version dup). Worth a pass before T05 branch-swap.
6. **Smoke dev-DB state** — orphan actorId from T13 (Alice
   `292e8c23…`), 4 products all in "Featured" with sortOrder=0. Prod
   DB will be clean — smoke-isms expected.
7. **NUXT_* prefix gotcha** — keep top of `.memory/gotchas.md`.

## What's Next (user's call)

**T02 transactional emails is in flight.** A parallel session spawned
`.plans/transactional-emails/` on 2026-04-20 with 7 sub-tasks (staff
invite vertical slice first, then password reset, order confirmation,
welcome, verification, trial-ending, retrofit sweep). Provider decision
in that sub-plan: SMTP via `@commercejs/notification-smtp` (NOT Resend
as the master plan originally pointed to — keeps the existing `SMTP_*`
env-var shape from the worker.ts stub). eaas-launch T02 row flipped 🟡
→ 🟢.

To continue T02: enter `.plans/transactional-emails/plan.md` — the
current ship target is sub-task T01 (staff-invite end-to-end pipeline
proof).

To finish remaining T01 work: just scenario 8 browser check; otherwise
T01 is effectively closed for this repo's standards.

## Live Deployment

- App: `commercejs-cloud` (Fly.io, Frankfurt)
- Latest image: tip of `fly/eaas` after commit `528867a` (2 deploys
  this session: `beea6d9` then `528867a`)
- Health: `https://commercejs-cloud.fly.dev/api/_health` → 200
- Smoke: `https://smoke.commercejs.cloud` owner login works, bcrypt
  async 657ms warm, 4 products + 1 "Featured" category (4 attached)

## Where to Look

| Question | File |
|---|---|
| Project orientation + current phase (start here) | `.plans/grand-plan.md` |
| eaas-launch master plan (T01–T05) | `.plans/eaas-launch/plan.md` |
| T01 task spec + Execution Summary | `.plans/eaas-launch/tasks/T01.md` |
| What shipped this session + acceptance table (detailed) | `.memory/checkpoints/2026-04-20T2247.md` |
| T01 locally done (before deploy) | `.memory/checkpoints/2026-04-20T1815.md` |
| T06–T13 merchant-admin close | `.memory/checkpoints/2026-04-20T1600.md` |
| Architectural decisions (locked) | `.memory/decisions.md` |
| Hard-won bugs | `.memory/gotchas.md` |
| Phase 7 roadmap state | `.plans/roadmap.md` |
| T02 sub-plan (in flight) | `.plans/transactional-emails/plan.md` |
| Project-wide Claude instructions | `CLAUDE.md` |
| Secrets (smoke login, Fly, Neon, Tap, SMTP, Tigris) | `.secrets` (gitignored) |
