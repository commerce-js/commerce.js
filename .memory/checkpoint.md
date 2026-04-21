# Checkpoint

> Latest detailed checkpoint: [`.memory/checkpoints/2026-04-21T0353.md`](checkpoints/2026-04-21T0353.md)
> Previous checkpoint: [`.memory/checkpoints/2026-04-20T2247.md`](checkpoints/2026-04-20T2247.md)

## Current Phase

**transactional-emails T01 (staff-invite vertical slice) is code-
complete on `fly/eaas`.** Four commits this session:
- `d4b68e2` feat(platform) — `staff_invites` table + token helpers +
  null-password login guard + 19 unit tests
- `a5716ea` feat(dashboard) — SMTP provider singleton +
  `server/emails/` template system + worker handler extraction + 11
  tests
- `6c16779` feat(dashboard) — `/api/admin/staff` invite dispatch +
  PUBLIC `/api/admin/invite/[token]` validate + accept routes
- `5df66eb` feat(storefront) — `/admin/invite/[token].vue` pre-auth
  accept page + `/admin/staff/new.vue` invite/manual toggle

**Smoke acceptance (8 scenarios) blocked on operator SMTP pre-reqs
(EXPLICIT-GO).** Choose provider (SES SMTP me-south-1 / Mailgun /
Postmark / Resend-SMTP), provision credentials, DKIM+SPF+DMARC on
`commercejs.cloud`, `fly secrets set SMTP_*` on `commercejs-cloud`
app, then deploy + run scenarios 1–8 from T01.md with a Commerce.js
team inbox as recipient.

eaas-launch T02 (transactional emails) row on the master plan
remains 🟢 In Progress; sub-plan T01 → 🟢 In Progress (was 🟡). T02
sub-plan still gates T02 (password reset) / T03 (order confirm) /
T04 (welcome) / T05 (verify) / T06 (trial-ending) / T07 (retrofit
sweep) on this slice's smoke completion.

## What Just Landed (T01 code-complete, 2026-04-21)

See [`2026-04-21T0353.md`](checkpoints/2026-04-21T0353.md) for the
full diff surface + architectural decisions + gaps.

Highlights to carry forward:
- **Worker handlers extracted to `server/utils/worker-handlers.ts`**
  so vitest can mock deps without Redis connecting. Shape for every
  future handler (T06 repeatable trial-ending job, T07 retrofit).
- **Template subjects belong to the template.** `SendEmailJob.subject`
  is optional; worker falls back to `template.subject(vars)`.
- **Token = 32 random bytes → base64url → sha256 hex at rest.**
  Race-safe consumption via `WHERE used_at IS NULL`.
- **admin_users.password_hash is now nullable on the merchant DB.**
  `invited` state is the only null case; login rejects before bcrypt.
- **`inviteUrl` built from request host + proto.** Custom domains +
  subdomains both work without hardcoding `commercejs.cloud`.
- **Dashboard vitest setup is minimal but real** — one config, one
  script, uses root vitest devDep.

## Carry-Overs Into Future Sessions

1. **BLOCKING — operator SMTP provisioning (EXPLICIT-GO).** Service
   choice (recommend SES me-south-1) + credentials + DKIM/SPF/DMARC
   on `commercejs.cloud` + `fly secrets set SMTP_*`. Without these,
   Scenario 1 onward can't run.
2. **Acceptance recipient** — dev-team inbox (e.g.
   `baker+invite-test@xyz.dev`). Smoke merchant's default
   `qa@smoke-test.local` won't route. Document the chosen address in
   T01.md Execution Summary.
3. **Deliverability warmup** — first real send from a fresh
   DKIM-verified domain can land in spam. Not a code issue; flag in
   scenario 2 so we don't false-positive on a spam check.
4. **Dashboard `pnpm typecheck` pre-existing errors** carry over
   from 2026-04-20 (h3 auto-imports, ioredis dup). My changes don't
   add to the pile.
5. **T01 scenario 8 (Reka console errors) from 2026-04-20** still
   open — browser sweep still pending.
6. **`@commercejs/storage-s3 v0.2.1` publish** still open — rides
   T05 branch-swap or explicit release-branch publish.
7. **Shared `handlePlatformThrow` helper** idea from 2026-04-20
   still unclaimed. Small DX win.
8. **Repeatable-jobs infra for T06 (trial-ending)** deferred — no
   BullMQ config changes this session.

## What's Next (user's call)

To unblock T01 smoke acceptance: pick SMTP service + provision
credentials + DNS + `fly secrets set` + deploy + run 8 scenarios on
`smoke.commercejs.cloud` with a team inbox. Sub-plan T01 flips ✅
after that.

To start sub-plan T02 (password reset) right now without waiting on
operator SMTP: technically possible — code would land but can't be
acceptance-tested. Recommend finishing T01 acceptance first so each
task ships with a real user-facing proof.

## Live Deployment

- App: `commercejs-cloud` (Fly.io, Frankfurt)
- Current prod tip: `528867a` (eaas-launch T01 PATCH fix from
  2026-04-20). No new deploy this session.
- Health: `https://commercejs-cloud.fly.dev/api/_health` → 200
- Smoke: `https://smoke.commercejs.cloud` owner login works

## Where to Look

| Question | File |
|---|---|
| Project orientation + current phase (start here) | `.plans/grand-plan.md` |
| Sub-plan (in flight) | `.plans/transactional-emails/plan.md` |
| T01 task spec + next-up scenarios | `.plans/transactional-emails/tasks/T01.md` |
| What shipped this session (detailed) | `.memory/checkpoints/2026-04-21T0353.md` |
| Previous session (T01 deployed + accepted) | `.memory/checkpoints/2026-04-20T2247.md` |
| eaas-launch master plan | `.plans/eaas-launch/plan.md` |
| Architectural decisions (locked) | `.memory/decisions.md` |
| Hard-won bugs | `.memory/gotchas.md` |
| Phase 7 roadmap state | `.plans/roadmap.md` |
| SMTP provider source | `packages/notification-smtp/src/smtp-provider.ts` |
| Worker handlers (now testable) | `apps/dashboard/server/utils/worker-handlers.ts` |
| Staff-invite template | `apps/dashboard/server/emails/staff-invite.ts` |
| Invite accept UI | `apps/storefront/app/pages/admin/invite/[token].vue` |
| Project-wide Claude instructions | `CLAUDE.md` |
| Secrets (smoke login, Fly, Neon, Tap, SMTP [TBD], Tigris) | `.secrets` (gitignored) |
