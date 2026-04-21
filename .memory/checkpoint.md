# Checkpoint

> Latest detailed checkpoint: [`.memory/checkpoints/2026-04-21T0708.md`](checkpoints/2026-04-21T0708.md)
> Previous checkpoint: [`.memory/checkpoints/2026-04-21T0353.md`](checkpoints/2026-04-21T0353.md)

## Current Phase

**transactional-emails T01 ✅ Completed + deployed + smoke-accepted
on `commercejs-cloud.fly.dev` 2026-04-21.** Full email pipeline
(enqueue → BullMQ → worker → render → SMTP → ImprovMX → recipient
inbox) proven end-to-end. Fly-managed Upstash Redis DB in `fra`
replaced the exhausted free-tier DB.

**T02 (password reset, admin + buyer) starts now.** Sub-plan T02 row
flipped 🟢 In Progress in this docs commit. T02.md was pre-scaffolded
by an earlier session with a locked-in approach: single
`password_resets` table with `actor_type ('admin' | 'buyer')`
discriminator on the merchant branch DB; 1h expiry; enumeration-safe
`/forgot-password`; auto-login on reset complete; cross-actor token
rejection.

## What Landed This Session (docs-only)

1. **T01.md flipped to ✅** with Execution Summary amended to note
   deploy + 8/8 smoke, the `da62205` runtime-dep fix that unblocked
   the worker, the Fly-managed Upstash Redis swap, and a new
   "orphan-invited-row" carry-over (failed / lost invite leaves
   admin_users in an unusable state; operator-recoverable by
   delete+reinvite; future resend button).
2. **plan.md** — T01 row flipped 🟢 → ✅ with 5-commit list; T02 row
   flipped 🟡 → 🟢 In Progress; Change Log gained a 2026-04-21 (pm)
   entry capturing deploy + smoke + dep fix + Redis swap.
3. **This file** — bumped pointer to `2026-04-21T0708.md`.
4. **grand-plan.md** — to be updated alongside this commit with the
   T01 → ✅ flip and T02 → 🟢 In Progress flag.

## T02 Scope (next ship)

Two password-reset flows; full spec in
[`.plans/transactional-emails/tasks/T02.md`](../.plans/transactional-emails/tasks/T02.md).

- **Admin reset** — `/admin/forgot-password` + `/admin/reset/[token]`
  → platform `admin.auth.{requestAdminPasswordReset,
  verifyAdminPasswordResetToken, completeAdminPasswordReset}` →
  template `admin-password-reset.ts`.
- **Buyer reset** — `/account/forgot-password` +
  `/account/reset/[token]` → fill stubs in
  [`packages/platform/src/domains/customers.ts:123`](../packages/platform/src/domains/customers.ts:123)
  → template `buyer-password-reset.ts`.

Vertical-slice commit plan (mirror T01's rhythm):
1. Platform admin side (table + helpers + tests + parity).
2. Platform buyer side (stubs filled + tests + parity) — may fold
   into (1) if diff budget permits.
3. Dashboard templates + 6 PUBLIC routes + Zod + snapshot tests.
4. Storefront: 4 pages + "Forgot your password?" links on both
   login pages.
5. Deploy + 10-scenario smoke (explicit-go) → T02 ✅ docs commit.

## Carry-Overs Into Future Sessions

1. **Orphan `invited` admin_user rows** (new, from T01 smoke). Failed
   / lost invite leaves admin_users with `password_hash=NULL` +
   unused `staff_invites` row. Operator-recoverable today. Future:
   resend-invite button on staff list + DB cleanup helper.
2. **Customer-domain sync bcrypt** (pre-existing).
   `packages/platform/src/domains/customers.ts` still uses
   `hashSync`/`compareSync` for `login` + `register`. T02 writes new
   code paths async but does not convert the existing call sites —
   separate polish task.
3. **Rate-limit infra** — inline TODOs in T01 invite routes; T02
   will add more to `/forgot-password` + `/reset/[token]`. Deferred
   cross-cutting.
4. **Dashboard `pnpm typecheck` pre-existing errors** carry over
   (h3 auto-imports, ioredis version dup). Not blocking; worth a
   pass before T05 branch-swap.
5. **eaas-launch T01 scenario 8 (Reka console errors)** — separate
   from transactional-emails T01 scenario 8 (retry backoff). Still
   open; browser-only sweep on `smoke.commercejs.cloud`.
6. **`@commercejs/storage-s3 v0.2.1` publish** — rides T05 branch-
   swap or an explicit release-branch publish.
7. **Token-primitives factor-out** into
   `packages/platform/src/database/tokens.ts` — nice-to-have; may
   or may not land in T02.
8. **Smoke merchant schema drift** (products.id=UUID vs
   order_items.product_id=TEXT) — still default-deferred.
9. **Repeatable-jobs infra for T06 (trial-ending)** — still
   deferred.

## What's Next

Start T02 platform side: `password_resets` table + Prisma + Drizzle
+ lazy-migrate + the three admin-side methods + unit tests + parity
check. Autonomous per the operating protocol. Live deploy + smoke
remain EXPLICIT-GO.

## Live Deployment

- App: `commercejs-cloud` (Fly.io, Frankfurt)
- Current prod tip: `da62205` (T01 notification-smtp runtime dep
  fix). No new deploy this session.
- Health: `https://commercejs-cloud.fly.dev/api/_health` → 200
- Smoke: `https://smoke.commercejs.cloud` owner login works
- Redis: Fly-managed Upstash DB in `fra` (wired via
  `fly secrets set REDIS_URL=...`). Worker machine auto-starts on
  job arrival.

## Where to Look

| Question | File |
|---|---|
| Project orientation + current phase (start here) | `.plans/grand-plan.md` |
| Sub-plan (in flight) | `.plans/transactional-emails/plan.md` |
| T01 spec (now ✅) | `.plans/transactional-emails/tasks/T01.md` |
| T02 spec (starting) | `.plans/transactional-emails/tasks/T02.md` |
| This session (detailed) | `.memory/checkpoints/2026-04-21T0708.md` |
| Previous session (T01 code-complete) | `.memory/checkpoints/2026-04-21T0353.md` |
| eaas-launch master plan | `.plans/eaas-launch/plan.md` |
| Architectural decisions (locked) | `.memory/decisions.md` |
| Hard-won bugs | `.memory/gotchas.md` |
| Phase 7 roadmap state | `.plans/roadmap.md` |
| Staff-invite template (reference) | `apps/dashboard/server/emails/staff-invite.ts` |
| Template registry | `apps/dashboard/server/emails/_render.ts` |
| Admin auth domain | `packages/platform/src/admin/auth.ts` |
| Customer domain (stubs to fill) | `packages/platform/src/domains/customers.ts` |
| Invite accept page (reference shape) | `apps/storefront/app/pages/admin/invite/[token].vue` |
| Project-wide Claude instructions | `CLAUDE.md` |
| Secrets (smoke login, Fly, Neon, Tap, SMTP, Tigris, Redis) | `.secrets` (gitignored) |
