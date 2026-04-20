# Checkpoint

> Latest detailed checkpoint: [`.memory/checkpoints/2026-04-20T1600.md`](checkpoints/2026-04-20T1600.md)
> Previous checkpoint: [`.memory/checkpoints/2026-04-17T1800.md`](checkpoints/2026-04-17T1800.md)

## Current Phase

**Merchant-admin-followup workstream CLOSED.** T06–T13 all ✅. With the
earlier T01–T05 merchant-admin plan also ✅, the whole merchant-admin
scope on CommerceJS Cloud is done — no remaining admin-UI gap. T13
(audit log / activity feed) shipped + deployed + 9/9 acceptance green
on `smoke.commercejs.cloud` at 15:50 UTC today.

## What Just Landed (T13, 2026-04-20)

Three commits on `fly/eaas`:

- `2131a45` feat(platform): T13 activity log — AdminAPI.recordActivity +
  listActivity
- `82645cf` feat(merchant-admin): T13 activity log — audit helper + route
  retrofits + timeline UI
- `963a125` fix(merchant-admin): use sentinels for empty USelect values
  (out-of-scope USelect empty-value fix on products/index.vue +
  theme.vue — fourth appearance of the Reka pattern)

Plus the docs commit flipping plan trackers + grand-plan State Snapshot
+ filling Lessons Learned across the whole T06–T13 workstream.

## What Was Built (T13 in a paragraph)

Every mutation on the merchant admin API now writes an append-only row
to a new `activity_events` table on the merchant's Neon branch.
AdminAPI.recordActivity + listActivity on both Prisma + Drizzle drivers
at parity (153/153 exports in sync). The dashboard's audit.ts helper
reads the current merchant session, snapshots actorId + actorEmail at
call time, and calls recordActivity with blanket try/catch so an audit
failure can't break the business mutation. 15 existing mutation routes
retrofitted to call the helper AFTER the platform call. /admin/activity.vue
renders a day-grouped timeline with actor + entityType + date-range
filters (UX matches T11 analytics). Sidebar "Activity" link lands between
Theme and Settings. Lazy-migrate pattern confirmed for CREATE TABLE IF
NOT EXISTS (first live test, after T09/T12 proved the ADD COLUMN shape).
Full task summary in
[`.plans/merchant-admin-followup/tasks/T13.md`](../.plans/merchant-admin-followup/tasks/T13.md).

## Carry-Overs Into Future Sessions

See [`2026-04-20T1600.md`](checkpoints/2026-04-20T1600.md) for the
full list. New items from T13:

1. **USelect sentinel helper** — four consumers deep (T08 '__root__',
   T13 'all', T12-fix '__default__', T03 status). One composable kills
   the repetition. Pre-work for the next admin task.
2. **T13 "deleted" chip UX polish** — only fires for actorId=null
   (system actions), not for orphaned-after-delete actorId. Cross-check
   against listAdmins() would fix it. v2 polish.

Ongoing carry-overs unchanged from 2026-04-17:

3. Platform categories hardening (T08-surfaced gaps).
4. bcrypt.compareSync → async compare (T01-review).
5. @commercejs/storage-s3 v0.2.1 changeset unreleased.
6. NUXT_* prefix gotcha — keep top of `.memory/gotchas.md`.
7. Smoke merchant schema drift — ::text cast pattern for any new raw
   SQL join.

## What's Next (user's call)

Three obvious candidates:

1. **Tap subscription billing** — merchant SaaS plan charges. No plan
   doc yet. `Merchant.tapCustomerId` column plumbed.
2. **Transactional emails** — `handleSendEmail` stub in worker.ts.
   Unblocks T09's deferred email-invite flow.
3. **Step 9 fly-migration-plan** — self-service signup + plan enforcement.
   The last EaaS pipeline piece before public launch.

Or a "platform polish" commit bundling the USelect sentinel helper +
categories hardening + bcrypt fix.

## Live Deployment

- App: `commercejs-cloud` (Fly.io, Frankfurt)
- Image: tip of `fly/eaas` after today's 15:45 UTC deploy
- Health: `https://commercejs-cloud.fly.dev/api/_health` → 200
- Smoke merchant: `https://smoke.commercejs.cloud` — admin login
  working, 5 activity events populated from acceptance run.

## Where to Look

| Question | File |
|---|---|
| Project orientation + current phase (start here) | `.plans/grand-plan.md` |
| What shipped this session + carry-overs (detailed) | `.memory/checkpoints/2026-04-20T1600.md` |
| T13 task spec + Execution Summary | `.plans/merchant-admin-followup/tasks/T13.md` |
| T06–T13 workstream Lessons Learned | `.plans/merchant-admin-followup/plan.md` |
| Architectural decisions (locked) | `.memory/decisions.md` |
| Hard-won bugs | `.memory/gotchas.md` |
| Phase 7 roadmap state | `.plans/roadmap.md` |
| Project-wide Claude instructions | `CLAUDE.md` |
