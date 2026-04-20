# Checkpoint

> Latest detailed checkpoint: [`.memory/checkpoints/2026-04-20T1815.md`](checkpoints/2026-04-20T1815.md)
> Previous checkpoint: [`.memory/checkpoints/2026-04-20T1600.md`](checkpoints/2026-04-20T1600.md)

## Current Phase

**eaas-launch T01 (platform polish) shipped locally 2026-04-20.** Single
bundle commit `beea6d9` cleared six carry-overs from the T01–T13
merchant-admin workstream. Live deploy + 9-scenario smoke acceptance
deferred pending explicit user go-ahead. After acceptance, T02
transactional emails is next on the eaas-launch critical path
(emails-first gates T03 billing + T04 signup).

## What Just Landed (T01, 2026-04-20)

One commit on `fly/eaas`:

- `beea6d9` feat(eaas-launch): T01 platform polish — sentinel helper
  + bcrypt async + categories hardening

Plus plan + checkpoint + grand-plan docs flip in this same session.

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

1. **T01 live deploy + 9-scenario smoke acceptance** — explicit-go
   gated. Scenarios in T01.md Test Scenarios (login latency / category
   delete with products / self-parent / descendant-cycle / Sort column
   / orphan deleted chip / system-action chip / no Reka console errors
   / storage-s3 0.2.1 published).
2. **@commercejs/storage-s3 v0.2.1 publish** — changeset file
   verified; publish runs via CI from a publish-capable branch.
   fly/eaas has no release workflow wired, so this rides the T05
   branch-swap or an explicit `pnpm changeset publish` from main.
3. **Smoke merchant schema drift** — Option B in place
   (`::text` casts in analytics); dedicated
   `.plans/schema-normalize/` plan if we decide to retire them.
4. **Pre-existing apps/ typecheck debt** — storefront + dashboard
   surface ~36 TS errors on unrelated admin pages (h3 resolution,
   `@vueuse/core`, `Image.altText`, `Address.email/name`, ioredis
   version dup). Worth a pass before T05 branch-swap.
5. **NUXT_* prefix gotcha** — keep top of `.memory/gotchas.md`.

## What's Next (user's call)

**After T01 deploy + acceptance**:

**T02 transactional emails** — the emails-first critical path on
eaas-launch. Gates T03 billing and T04 signup. Will spawn
`.plans/transactional-emails/plan.md` on start.
`@commercejs/notification-resend` provider already published;
scope is templates + BullMQ wiring + `handleSendEmail` stub
replacement in `apps/dashboard/worker.ts`.

## Live Deployment

- App: `commercejs-cloud` (Fly.io, Frankfurt)
- Image: tip of `fly/eaas` BEFORE this commit (T01 not yet deployed)
- Health: `https://commercejs-cloud.fly.dev/api/_health` → 200

## Where to Look

| Question | File |
|---|---|
| Project orientation + current phase (start here) | `.plans/grand-plan.md` |
| eaas-launch master plan (T01–T05) | `.plans/eaas-launch/plan.md` |
| T01 task spec + Execution Summary | `.plans/eaas-launch/tasks/T01.md` |
| What shipped this session + carry-overs (detailed) | `.memory/checkpoints/2026-04-20T1815.md` |
| Previous session (T06–T13 recap) | `.memory/checkpoints/2026-04-20T1600.md` |
| Architectural decisions (locked) | `.memory/decisions.md` |
| Hard-won bugs | `.memory/gotchas.md` |
| Phase 7 roadmap state | `.plans/roadmap.md` |
| Project-wide Claude instructions | `CLAUDE.md` |
