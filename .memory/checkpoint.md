# Checkpoint

> Latest detailed checkpoint: [`.memory/checkpoints/2026-07-03T1930.md`](checkpoints/2026-07-03T1930.md)
> Previous checkpoint: [`.memory/checkpoints/2026-04-21T1600.md`](checkpoints/2026-04-21T1600.md)

## Current Phase

**2026-07-04 — two work lines merged on `fly/eaas`.** Local line
(transactional-emails T01–T03 + eaas-launch, below) merged with
`origin/fly/eaas` (PR #50: control-plane hardening + CI, next).
Merge conflicts resolved: `worker.ts` kept the extracted-handlers
architecture + real templates and ported remote's `--dry-run` block
(CI depends on it); `vitest.config.ts` kept the wider
`**/__tests__/**` glob; docs unioned; lockfile regenerated.

### Remote line (PR #50 — control-plane hardening, 2026-07-03/04)

**2026-07-03 — security + baseline hardening + M0.5 docs/CI reorg on a branch cut from live `fly/eaas`.** In brief: a handoff describing an "M0" reconciliation was found to be disconnected from that container (never pushed, unrecoverable — see checkpoint "Context reconciliation"). Instead, shipped the premise-independent, high-value parts on `claude/commercejs-m0-m05-push-il5lep`: a **fail-closed session seal** (prod refuses to boot without `NUXT_SESSION_PASSWORD` ≥32 — boot-verified both ways), a `@commercejs/core` typecheck fix (restores 37/37), and the M0.5 `.plans`/CLAUDE.md/root-hygiene/CI reorg. All §7 gates green; 301 tests; 1 confirmed security-review finding fixed.

**2026-07-04 follow-up (same branch, after PR #50 opened):** closed a real
unauthenticated-control-plane hole — every `/api/merchants/*` route ran with no
auth (anyone could list tenants / create merchants → billable provisioning).
Added `requireDashboardSession` (read/admin) + `authorizeDashboardSession` +
API-key mint/revoke/list; stopped leaking merchant DB credentials
(`toPublicMerchant`) and `api_keys.keyHash`; wired the transactional-email SMTP
transport into `worker.ts` (superseded on merge by the extracted-handlers
version — same feature, kept local architecture + remote's `--dry-run`).
Independent reviewer + security agents on each diff (both clean; their
pre-existing-leak finding drove the creds fix). +13 dashboard unit tests.
See `.memory/decisions.md` (2026-07-04) and grand-plan Change Log.
**Open owner decisions** from that line: Neon sharding (branch-per-merchant
vs project-per-merchant), region (`fra` live / `bah` target), recover lost
M0 work?

### Local line (transactional-emails)

**transactional-emails T01 ✅ + T02 ✅ + T03 🟢** — T03 (order
confirmation) code-complete + deployed 2026-04-21 evening to
`commercejs-cloud.fly.dev` (image
`deployment-01KPR2EB4F8KRW9Q7JNE5M3KDH`, 4 machines green in `fra`).
Two feature commits: `3c76e04` (template + 13 render tests + T03
scaffold) + `0ddb411` (triggers on both finalize paths — storefront-
native `checkout/complete.post.ts` unconditional + hosted-checkout
Tap path split across `cart-confirm.get.ts` + `webhooks/tap-payment`
with status-before-update check as natural dedup; `cart-pay.post.ts`
propagates merchantId/buyerEmail/buyerName through Tap `metadata`
and appends `?merchant=<subdomain>` to `webhookUrl`; hosted-checkout
gains `bullmq` + `ioredis` and producer-only `utils/{queue,redis,
orderConfirmationEmail}.ts` mirrors).

Curl-level smoke on live: health 200, smoke storefront SSR 200 on
home + `/order-confirmation`, hosted-checkout webhook on
`checkout.commercejs.cloud` correctly enforces `?merchant=` (400
without, 401 with bad sig — both expected); `cart-pay` 400
validation reachable.

**T03 awaiting live-purchase acceptance.** Real card order through
`smoke.commercejs.cloud/checkout` → Tap 3DS → email at buyer inbox
is the only path not reachable via curl. Once confirmed, T03 flips
🟢 → ✅ with Execution Summary + plan.md close-out + grand-plan
phase-7 row update.

**T02 (password reset, admin + buyer) code-complete on all 3 surfaces
2026-04-21.** Three feature commits landed by a concurrent session:
- `7b60363 feat(platform)` — shared `password_resets` table with
  `actor_type` discriminator on merchant branch DB, 6 domain methods
  (3 admin on `admin/auth.ts` + 3 buyer filling `customers.ts:123`
  stubs), cross-actor-type rejection in `verify*`, async bcrypt on
  new paths, 31 unit tests, parity 161.
- `f142cca feat(dashboard)` — 2 templates (`admin-password-reset.ts`
  + `buyer-password-reset.ts`) + 6 PUBLIC routes
  (admin + storefront × forgot / reset-GET / reset-complete) +
  shared Zod schemas + adapter surface expose + 6 render tests.
  Enumeration-safe 200 on forgot-password; session cookie issued on
  complete for both actor types.
- `6efb80a feat(storefront)` — 4 pages (admin pre-auth +
  buyer default-layout) + "Forgot password?" link under
  `/admin/login`.

**Remaining on T02**: EXPLICIT-GO `fly deploy` + 10-scenario smoke
acceptance on `commercejs-cloud.fly.dev` → T02 → ✅ final docs flip.
No code work left.

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

## T02 Ship State

Full spec in [`.plans/transactional-emails/tasks/T02.md`](../.plans/transactional-emails/tasks/T02.md).
Three feature commits land the full vertical slice in one day
(concurrent session — not this one):

1. ✅ Platform (`7b60363`) — `password_resets` + admin + buyer helpers.
2. ✅ Dashboard (`f142cca`) — templates + 6 routes + adapter surface.
3. ✅ Storefront (`6efb80a`) — 4 pages + forgot-password link.
4. 🔲 Deploy + 10-scenario smoke on `commercejs-cloud.fly.dev` (EXPLICIT-GO).
5. 🔲 T02 → ✅ final docs commit.

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
