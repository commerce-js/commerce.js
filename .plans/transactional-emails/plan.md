# Transactional Emails — Sub-Plan

> **Context**: Spawned from [`.plans/eaas-launch/tasks/T02.md`](../eaas-launch/
> tasks/T02.md) on 2026-04-20 as the emails-first workstream on the
> EaaS closing plan. `handleSendEmail` in `apps/dashboard/worker.ts` has
> been a log-only stub since the worker shipped (Step 6 of the Fly
> migration plan). This plan wires it through to
> [`@commercejs/notification-smtp`](../../packages/notification-smtp/)
> (the published nodemailer-backed provider — matches the existing
> stub's `SMTP_*` env-var shape), ships the first batch of transactional
> templates, and retrofits every surface that should send email to
> enqueue a job.
>
> **Gates**:
> - T02 (this plan) unblocks merchant-admin-followup T09's deferred
>   email-invite flow (`admin_users.status='invited'` already landed
>   2026-04-20 on `fly/eaas`).
> - T02 gates eaas-launch T03 (Tap billing) → trial-ending (7-day /
>   1-day) warnings + invoice receipts.
> - T02 gates eaas-launch T04 (Step 9 self-service signup) → welcome
>   email + email verification double-opt-in.
>
> **Scope**: Multi-session effort, likely 5–7 sub-tasks over 2–3 weeks.
> v1 is transactional only — marketing / lifecycle / unsubscribe UX
> all deferred.
>
> **Success criteria**: Every enumerated trigger point (staff invite,
> password reset × 2, order confirmation, welcome, verify, trial-
> ending) enqueues a BullMQ `send-email` job that the worker dispatches
> via SMTP; delivery observable at a real inbox (and in the chosen SMTP
> service's logs, if applicable); BullMQ retry-with-backoff survives
> a mocked transport error; T02 in the eaas-launch master flips to ✅.

---
<!-- PROGRESS SECTION -->

### Progress Summary

* [ ] **Research & Strategy Selection** ✅ Completed (2026-04-20)

* [x] [**T01**: Provider wiring + staff invite (first vertical slice)](tasks/T01.md) — Status: ✅ Completed — code-complete + deployed + 8/8 smoke scenarios green on `commercejs-cloud.fly.dev` 2026-04-21. Five commits: `d4b68e2` platform, `a5716ea` dashboard infra, `6c16779` dashboard routes, `5df66eb` storefront, `da62205` runtime-dep fix. Fly-managed Upstash Redis DB (fra) replaces the exhausted free-tier DB.
* [x] [**T02**: Password reset (admin + buyer)](tasks/T02.md) — Status: ✅ Completed — code-complete + deployed + smoke-accepted on `commercejs-cloud.fly.dev` 2026-04-21. Four feature commits: `7b60363` platform (password_resets + 6 methods + 31 tests + parity 161), `f142cca` dashboard (2 templates + 6 routes + Zod + adapter + 6 render tests), `6efb80a` storefront (4 pages + forgot-password link), `834cfc5` status='active' fix on reset-complete (surfaced by concurrent-session smoke run). Curl-based scenarios green on live: enumeration-safe 200 on admin+buyer unknown/known email, 400 Zod on malformed, 404 on random tokens (both flows), 400 on bad-token complete, audit row lands on known-email request with 1h expiry, 4 pages render 200, /admin/login has the "Forgot password?" link.
* [ ] [**T03**: Order confirmation (customer-facing)](tasks/T03.md) — Status: 🟡 Planned — triggered on hosted-checkout finalize
* [ ] [**T04**: Welcome email (merchant signup)](tasks/T04.md) — Status: 🟡 Planned — also gates eaas-launch T04
* [ ] [**T05**: Email verification (double-opt-in)](tasks/T05.md) — Status: 🟡 Planned — signup + email-change flows
* [ ] [**T06**: Trial-ending warnings (7-day + 1-day, scheduled)](tasks/T06.md) — Status: 🟡 Planned — gates eaas-launch T03; introduces BullMQ repeatable jobs
* [ ] [**T07**: Retrofit outstanding trigger points](tasks/T07.md) — Status: 🟡 Planned — mop-up any send-sites not already retrofitted by T01–T06

<!-- END PROGRESS SECTION -->

---

## Research & Strategy Selection

**Status**: ✅ **Completed**

### Goal

Replace `handleSendEmail`'s log-only stub with a real SMTP-backed
dispatcher, layer a minimal template system on top, and wire every
send-site (staff invite, password resets, order confirmation, welcome,
verify, trial-ending) to enqueue through it. Every trigger point
exercises the same pipeline: trigger → `enqueueMerchantJob({type:
'send-email', ...})` → BullMQ → worker's `handleSendEmail` → nodemailer
SMTP transport → recipient inbox. Retry-with-backoff is a free feature
of the existing queue config (`attempts: 5`, `backoff: exponential@5s`).

### Context

A read of the existing code surfaces a handful of pre-existing decisions
that shape this plan:

- **The job shape is already defined.** `SendEmailJob` in
  [`apps/dashboard/server/utils/queue.ts`](../../apps/dashboard/server/
  utils/queue.ts) carries `{merchantId, to, subject, template, vars?}`.
  The `template` field is a string discriminator; `vars` is a loose
  `Record<string, unknown>`. The discriminated-union + overloaded
  `enqueueMerchantJob` pattern is healthy and stays.
- **The queue's default retry matches the task-spec ask.** `attempts:
  5`, `backoff: exponential@5s` in `queue.ts`. No change needed — the
  sub-plan's task spec mention of "3 attempts, exponential" is
  overridden by what's already there (matches `dispatch-webhook`).
- **Provider package is published + already understood.** `@commercejs/
  notification-smtp` v0.2.2 at
  [`packages/notification-smtp/src/smtp-provider.ts`](../../packages/
  notification-smtp/src/smtp-provider.ts) exposes
  `createSmtpProvider({host, port, secure?, auth?: {user, pass}, from, replyTo?, connectionTimeout?, socketTimeout?})`
  returning `NotificationProvider`. Uses nodemailer under the hood —
  works against any standard SMTP server (Amazon SES SMTP, Mailgun
  SMTP, Postmark SMTP, Gmail, self-hosted Postfix, etc.). The
  provider's `send()` accepts `NotificationMessage` with `{to, subject,
  html, text, template}` — nearly matches the BullMQ job shape, so the
  worker-side glue is thin.
- **Existing stub env vars are already correct.** The stub in
  `apps/dashboard/worker.ts` reads `SMTP_HOST`, `SMTP_PORT`,
  `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — keep them as-is. T01 wires
  these into `createSmtpProvider(...)`; no env-var swap, no
  secrets-reshuffle on the Fly side beyond populating the existing
  names with a real SMTP service's credentials.
- **SMTP service choice is deferred to T01.** The provider works against
  any SMTP server. Likely targets: Amazon SES SMTP (cheap, highest
  deliverability, needs AWS setup), Mailgun SMTP, Postmark SMTP, or
  Resend's SMTP endpoint (Resend supports SMTP alongside its API).
  Decision lives in T01 based on cost / setup overhead / deliverability
  tradeoffs. Call it out in T01's Operator pre-reqs so the DNS + auth
  paperwork lands before live acceptance.
- **T09 already shipped `admin_users.status='invited'` as forward-
  compat.** Status enum is `'active' | 'invited' | 'disabled'`; v1
  only writes `'active'`. The staff-invite slice writes `'invited'`
  on create + flips to `'active'` on accept. No schema change needed
  on the `admin_users` table itself.
- **Staff invites need a companion table.** Token (hashed), expiry,
  admin-user FK, single-use. New `staff_invites` table on the merchant
  branch DB, Prisma + Drizzle parity, `CREATE TABLE IF NOT EXISTS`
  lazy-migrate pattern (proven by T09/T12/T13).
- **Email delivery is a real-user side effect.** Smoke's merchant
  email (`qa@smoke-test.local`) won't route. Acceptance runs either:
  (a) use a dev-team inbox with `ALLOW_REAL_EMAIL=true` env flag for
  smoke; or (b) keep `SANDBOX` mode that only logs what *would* have
  been sent without calling the SMTP transport. (a) is simpler for T01 acceptance
  and lets us exercise the real pipeline — default choice.
- **Control DB has no sender-per-merchant columns yet.** `Merchant`
  model on the control DB has `name`, `email`, `subdomain`, plan, etc.
  — no `email_from_address`. v1 sends every email from a single
  Commerce.js-operated sender (e.g. `CommerceJS Cloud <no-reply@
  commercejs.cloud>`). Multi-sender "from this merchant's own domain"
  is a v2 concern (would need domain-verify UX and per-merchant SMTP
  credentials or a shared-transport + `from: "{merchant.name} <noreply@
  {subdomain}.commercejs.cloud>"` pattern — decide later).
- **T06 trial-ending needs new infra.** BullMQ repeatable jobs
  (cron-driven) is a new surface — the worker currently only consumes
  event-driven `Queue.add` calls. T06 introduces a scheduler entry
  that enqueues trial-expiring checks on a repeatable schedule.
- **Template location — co-located wins v1.** The T02.md scope anchor
  leans this way. Alternative (`@commercejs/email-templates` package)
  is premature — no external consumer, and we'd pay the publish-cycle
  tax every time a template changes. Decision: co-locate in
  `apps/dashboard/server/emails/` with one file per template exporting
  `{subject, html, text, defaults}`. Promote to a package only when a
  second codebase needs it.

### Strategy Proposals

**Option A — One vertical slice per commit, staff-invite first, then
mop-up by flow**

- **T01** — SMTP wiring + staff-invite vertical slice. Exercises the
  full pipeline: enqueue → worker → SMTP → inbox. Ships the deferred
  T09 invite flow on the way. Validates env-var swap, provider
  initialization, template rendering, and acceptance-at-a-real-inbox
  all in one flow.
- **T02–T06** — one flow per task (password reset / order confirm /
  welcome / verify / trial-ending). After T01 proves the infra,
  subsequent tasks are template + retrofit + acceptance, not infra.
- **T07** — catch-all retrofit task if any send-site didn't land
  naturally in T01–T06 (e.g. ops alerts).
- Pros: Each task ships a concrete user-facing flow to acceptance.
  Short feedback loop. Matches the merchant-admin / merchant-admin-
  followup rhythm that's landed 13+ times on this repo.
- Cons: Env-var swap + provider wiring land on T01, so a T01 hitch
  blocks the whole plan. Offset: T01's infra work is ~1 file
  (worker glue) + 1 file (provider factory module) + secrets set.

**Option B — Infrastructure task first, then templates as a batch,
then retrofits as a batch**

- **T01** — Infra only: env vars, provider module, worker wiring,
  test-send button. No templates, no retrofits.
- **T02** — All six templates in one commit (subject + HTML + text +
  render tests). No send-site retrofits.
- **T03** — All six retrofits in one commit. Wire every trigger.
- Pros: Clean separation of concerns — each task has a single theme.
- Cons: Templates-without-retrofit is useless and can't be acceptance-
  tested end-to-end. Massive T03 commit. No incremental user-facing
  wins. Rejected — prefers illusion-of-order over shippable slices.

**Option C — Parallel tracks by template "owner"**

- Billing templates (trial-ending, receipts) → T03 owns
- Auth templates (verify, reset, welcome) → T04 owns
- Commerce templates (order confirm) → owned by hosted-checkout
  integration
- This plan reduced to infra-only + staff-invite.
- Pros: Pushes ownership to the plan that needs each template.
- Cons: Each owner-plan duplicates template scaffolding (vars, render
  helper, `emails/` directory setup). And the plans want to ship
  *serially* (T02 before T03 before T04), so parallelism is theoretical.
  Rejected — false efficiency.

### Selected Approach

**Decision**: Option A — vertical slices per task, staff-invite first,
seven tasks total (T01 → T07).

**Rationale**:
- The merchant-admin-followup Lessons Learned specifically called out
  "read-first / end-to-end-vertical-slice first" as what went well —
  it caught schema drift, FK constraints, and pagination bugs before
  they became UI bugs. T01 is a direct application of that: prove the
  worker-to-SMTP pipeline end-to-end on the smallest real flow
  (staff invite), before any other template gets written.
- The staff-invite flow has a useful property for T01: **the recipient
  can be a Commerce.js-internal email address** (e.g. dev-team inbox).
  No external merchant-recipient liability during T01 acceptance.
- Commit rhythm matches T05 / T06–T13 / eaas-launch T01 — one task
  per commit (or 2–4 commits per task when platform+apps+docs split).
  Sub-plan's Change Log tracks exact commits.
- Option B is tempting for clean separation but trades real user-
  facing wins for theoretical tidiness. Option A's T01 alone fills
  an outstanding T09 gap.

**Key Findings**:

- **SMTP provider is ready.** No provider-package changes needed.
  If we do discover a rough edge during T01 wiring, we bump
  `@commercejs/notification-smtp` via changeset before consuming —
  do not copy-paste into the dashboard.
- **Retry policy inherits from the queue default.** No job-level
  override needed; `attempts: 5` / `backoff: exponential@5s` is the
  right shape for SMTP (transient connection errors / socket timeouts /
  4xx "try again later" responses are the common failure modes —
  exponential backs off within the queue's 7-day dead-letter window).
- **The existing job shape `{subject, template, vars}` is a useful
  hybrid** between fully-templated and fully-raw. T01's glue
  interprets `template` as a file key → loads the template → merges
  `vars` → overrides `subject` with the template's subject (or keeps
  the caller's override). See T01.md for exact contract.
- **v1 single-sender.** Every email goes from `CommerceJS Cloud
  <no-reply@commercejs.cloud>`. DKIM / SPF / DMARC on the sender
  domain's DNS are needed regardless of the SMTP service chosen —
  without them, Gmail / Outlook will spam-folder the output. If the
  SMTP goes through a reputable service (SES / Mailgun / Postmark /
  Resend-SMTP) they provide the DKIM selector + SPF `include:` record
  to paste into DNS; if it's self-hosted Postfix, OpenDKIM setup
  lands here too. Call out in T01 as an operator-side pre-req before
  the first live send.
- **Repeatable jobs are new infra for T06.** BullMQ supports
  `queue.add(name, data, {repeat: {pattern: '0 * * * *'}})` or
  `repeat: {every: 3600000}`. T06 picks one; introducing it is a
  one-line config addition, but we'll verify the worker consumes
  repeatable jobs (it does by default; no code change needed on the
  worker side).
- **Acceptance email inbox.** For T01 we'll direct the staff-invite
  to a Commerce.js team inbox (use a second account — any
  `+invite-acceptance@commercejs.dev` alias works). Future tasks
  (T02 buyer reset, T03 order confirm, T04 welcome, T05 verify) route
  to the same or similar test addresses.

**Implementation Plan** (high-level):

1. **T01 — Provider wiring + staff invite first**. New
   `apps/dashboard/server/emails/` directory with a tiny render
   helper + the invite template. Worker's `handleSendEmail` loads the
   named template, renders, dispatches via `createSmtpProvider` using
   the existing `SMTP_*` env vars. `fly secrets set SMTP_HOST=...
   SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... SMTP_FROM="CommerceJS
   Cloud <no-reply@commercejs.cloud>"`. New
   `staff_invites` table on the merchant DB (Prisma + Drizzle + lazy-
   migrate). `/api/admin/staff/invite.post.ts` (or an amend to
   `index.post.ts` accepting `sendInvite: true` flag) enqueues the
   email; `/api/admin/staff/invite/:token.post.ts` validates +
   expires + sets password. Storefront page `/admin/invite/[token].vue`.
   Audit log rows for `staff.invited` + `staff.invite_accepted`.
2. **T02 — Password reset**. Two templates (admin + buyer), two reset
   routes, two completion pages. Reuse T01's `staff_invites` pattern
   for the token table (or separate `password_resets` table — decide
   in T02). Gated by `requireMerchantSession` is NOT applicable here —
   these are pre-auth flows, so same path-parameter + DB-lookup shape
   as invite.
3. **T03 — Order confirmation**. Sent from the hosted-checkout's
   finalize path (or from an `order.created` platform event once the
   event bus is wired — check during T03). Template is
   customer-facing, renders line items + total + shipping address.
4. **T04 — Welcome email**. Triggered from signup completion (T04 of
   the eaas-launch plan will call this). Single short welcome +
   "verify your email" CTA that hands off to T05.
5. **T05 — Email verification**. Double-opt-in pattern. Token table
   `email_verifications` (control DB — this is a merchant-level
   concern), single-use, 24h expiry. `/verify/:token` route on the
   dashboard. Merchant row gets an `email_verified_at` column.
6. **T06 — Trial-ending**. BullMQ repeatable job (cron) scans
   `Merchant.trialEndsAt` daily. Enqueues 7-day + 1-day warnings.
   Idempotency via a `trial_warnings_sent` column (bitfield or
   timestamp-per-warning). First repeatable-job surface on the
   worker — call out in T06.
7. **T07 — Retrofit sweep**. Any trigger point missed by T01–T06
   (ops alerts, audit-log notifications for destructive actions,
   etc.) lands here. May be empty — in which case we skip to closing.

**Parallelization opportunity**: T02 (password reset) and T03 (order
confirmation) have no shared surface — separate routes, separate
templates. Either could ship first after T01. Serial-first order
(T02 → T03) is the default for one-session-at-a-time discipline.

---

## Architecture Reference

| Aspect | Decision | Source |
|---|---|---|
| Email provider | SMTP via `@commercejs/notification-smtp` v0.2.2 (nodemailer-backed) | `packages/notification-smtp/` |
| SMTP service target | Chosen in T01 — candidates: Amazon SES SMTP, Mailgun SMTP, Postmark SMTP, Resend SMTP endpoint, self-hosted Postfix | T01 operator pre-reqs |
| Env vars | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — existing stub names, keep them | `apps/dashboard/worker.ts`, `fly secrets set` (T01) |
| Sender identity (v1) | Single Commerce.js-operated sender — `CommerceJS Cloud <no-reply@commercejs.cloud>`. Requires DKIM/SPF/DMARC on the sender domain regardless of the SMTP service chosen. | T01 pre-req |
| Sender identity (v2) | Per-merchant sender domain — deferred to own plan | Out of scope here |
| Job queue | Existing `merchant-jobs` BullMQ queue — `SendEmailJob` discriminant already defined | `apps/dashboard/server/utils/queue.ts` |
| Retry policy | Queue default (`attempts: 5`, `backoff: exponential@5s`) | Same file |
| Worker handler | `handleSendEmail` in `apps/dashboard/worker.ts` — swap stub for real dispatcher | T01 |
| Templates | Co-located in `apps/dashboard/server/emails/*.ts`, one file per template exporting `{subject, html, text, defaults}` | T01 + T02 research findings |
| Template rendering | Plain template literals with `${vars.x}` interpolation — no MJML / React Email / Handlebars in v1. Promote to a real templating engine when a second codebase consumes it. | T01 |
| Token storage | Hashed at rest (sha256, not bcrypt — short-lived tokens don't need work-factor cost). Single-use, expiry column. | T01 invite schema |
| Staff invite table | `staff_invites` on merchant branch DB — Prisma + Drizzle + parity + lazy-migrate | T01 |
| Password reset tables | Decide in T02 — likely `password_resets` on the merchant branch DB for admin resets, same shape for buyer resets (different route namespace). | T02 |
| Email verification table | `email_verifications` on the control DB — merchant-level concern | T05 |
| Trial-warning tracking | `merchants.trial_warnings_sent` timestamp column or similar — idempotent re-runs | T06 |
| Acceptance inbox | Dev-team inbox (e.g. `+invite-acceptance@commercejs.dev`) for each T01–T05 flow. Smoke's `qa@smoke-test.local` doesn't route. | All tasks |
| Sandbox mode (future) | Out of scope for v1. If the need arises, add `EMAIL_SANDBOX_MODE=true` that short-circuits to a log-only path. | Deferred |

---

## Implementation Tasks

Task files live in [`tasks/`](tasks/) — see T01–T07 for execution
detail.

**Dependency order:**

```
  T01  Provider wiring + staff invite    (infra lands here; vertical slice)
        │
        ├─► T02  Password reset          (parallelizable with T03)
        │
        ├─► T03  Order confirmation      (parallelizable with T02)
        │
        ├─► T04  Welcome                 (hands off to T05)
        │         │
        │         ▼
        │       T05  Email verification  (T04's CTA lands here)
        │
        ▼
      T06  Trial-ending                 (new infra: repeatable jobs)
        │
        ▼
      T07  Retrofit sweep               (may be empty)
```

---

## Constraints & Check-with-User Gates

- **One-task-per-commit-bundle rhythm.** Carries over from the merchant-
  admin-followup plan. Multi-surface tasks (platform schema + apps
  + docs) may split into 2–4 commits per task — merchant-admin-
  followup T09, T12, T13 proved this cleanly.
- **Deploy gates stay explicit.** Per user preference, `fly deploy`
  requires explicit "go". Build + test + typecheck + local curl +
  Prisma `migrate dev` + unit tests all autonomous.
- **Secrets setup is an explicit-go step.** `fly secrets set
  SMTP_HOST=... SMTP_PORT=... SMTP_USER=... SMTP_PASS=... SMTP_FROM=...`
  happens once, in T01, with the user's credentials. Do not ask to
  generate credentials — operator provides them.
- **Sender domain DKIM/SPF/DMARC** — one-time DNS setup on the sender
  domain before the first live send. The SMTP service's own
  onboarding lists the exact records. Operator task, not a code
  change. Without these, Gmail / Outlook spam-folder the output
  regardless of which SMTP transport is chosen.
- **Email delivery is a side effect on real users.** Acceptance runs
  must direct sends to dev-team inboxes, not merchant-facing addresses,
  until a template has shipped end-to-end at least once. Smoke
  merchant's `qa@smoke-test.local` doesn't route — the SMTP transport
  returns a hard-bounce error (non-existent TLD); plan for it.
- **Platform schema changes need parity.** T01 adds `staff_invites`,
  T02 may add `password_resets`, T06 adds trial-warning tracking on
  the control DB (not merchant). Merchant DB changes need Drizzle
  parity + `check-query-parity.sh` green. Control DB is Prisma-only
  (no parity check).
- **Audit log integration is free and should be used.** Every invite
  sent, invite accepted, password reset requested, password reset
  completed → all get a `recordActivity` row via the existing
  `apps/dashboard/server/utils/audit.ts` fire-and-forget helper.
  Staff invite activity rows render in the T13 timeline.
- **Provider interface changes require a package bump.** If T01 needs
  a tweak to `createSmtpProvider` (e.g. headers pass-through, pool
  reuse), bump `@commercejs/notification-smtp` via changeset, publish,
  consume. Do not copy-paste into the dashboard. This rule is
  locked in `.memory/decisions.md`.
- **No runtime template compilation.** Templates are TypeScript modules
  with template literals — evaluated at request time with
  `templateFn(vars)`. No Handlebars / EJS / Mustache runtime.
- **Smoke merchant acceptance routes email to dev inbox by default.**
  For T01–T05 acceptance the invite form accepts any email; we use a
  team-owned inbox. When signup (eaas-launch T04) ships, buyer-facing
  flows automatically hit real external addresses — document the
  transition clearly.

---

## Out of Scope (Deferred, with destination plans)

These items came up during research but are explicitly **not** in this
plan. Each has a forward-reference to the plan that owns it.

- **Marketing / lifecycle emails** (newsletters, re-engagement,
  win-back). Transactional-only is v1. Deferred to a future
  `.plans/lifecycle-emails/` plan.
- **SMS / WhatsApp / push notifications.** Different provider stack;
  need their own plan doc.
- **Open / click tracking.** Some SMTP services (SES, Mailgun,
  Postmark, Resend-SMTP) expose open/click events via webhooks;
  nodemailer doesn't surface them directly. v2 concern under
  `.plans/email-analytics/`.
- **Multi-language email content.** v1 ships English templates only,
  with a TODO at the top of each template file for Arabic localization
  once product demand warrants it. Routing already respects
  `Merchant.locale`, so the hook is available.
- **User-preferences / unsubscribe UX.** Transactional emails are
  service-critical and explicitly exempt from marketing-opt-out
  requirements (CAN-SPAM, CASL, PECR). No unsubscribe link needed in
  v1 transactional flows.
- **Per-merchant sender domains.** v1 sends every email from a single
  Commerce.js-operated sender. Multi-sender needs domain-verify UX
  and per-merchant SMTP credentials or a shared-transport + dynamic-
  from pattern. Deferred to a `.plans/per-merchant-sender/` plan.
- **Email template theming (merchant logo, brand colors).** v1
  templates are plain-styled branded for CommerceJS Cloud. v2 can
  read merchant theme data (which landed in T12) and render with
  `--cjs-primary` / logo. Deferred to a `.plans/branded-emails/` plan.
- **Sandbox / preview mode.** If demand arises, add `EMAIL_SANDBOX_MODE=
  true` → short-circuit the provider call to logging. Not v1.
- **Inbound email parsing.** Most SMTP services offer inbound webhooks.
  No v1 use case.
- **Retry UI / manual re-send on failures.** BullMQ's internal retry
  (up to 5 attempts) is the operator surface for this in v1. Permanent
  failures land in the dead-letter zone and are observable via the
  BullMQ admin UI / logs. If merchant-operator-facing retry is needed
  later, it'd live in the dashboard under `/admin/emails` — out of
  scope here.

---

## Lessons Learned (Post-Implementation)

> Fill this section out after T01–T07 complete. Follow the merchant-
> admin-followup precedent: 4–6 findings per subhead, written as
> forward-applicable guidance for the next email-adjacent plan.

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

- **2026-04-21** (late late pm): T02 ✅ **Completed** —
  `commercejs-cloud` redeployed to version 70
  (`deployment-01KPQXJ801379BT86VMESW04GK`, image 222 MB, 4 machines
  rolled green in `fra`). Curl-based smoke on
  `smoke.commercejs.cloud` (no browser, no real inbox needed since
  the email-roundtrip path had already been exercised by the
  concurrent-session smoke that produced `834cfc5`): enumeration-
  safe 200 for admin + buyer `forgot-password` on unknown AND known
  emails (`qa@smoke-test.local` 0.9s), Zod 400 on malformed email
  body (admin + buyer both), 404 on random tokens for
  `/api/admin/reset/:token` GET + `/api/storefront/auth/reset/:token`
  GET, 400 "Reset link is invalid or has already been used" on
  bad-token `/complete` POST, audit log shows
  `auth.password_reset_requested` row landing at known-email-known
  time with the 1-hour `expiresAt` in the `diff` payload — confirms
  the `requestAdminPasswordReset` branch actually hits the DB when
  the email matches, 200 HTML for all four pages
  (`/admin/forgot-password`, `/admin/reset/[token]`,
  `/account/forgot-password`, `/account/reset/[token]`), "Forgot
  password?" link verified on `/admin/login`. Email + click +
  complete round-trip was verified earlier by the concurrent
  session's smoke run; the `834cfc5` commit message explicitly
  says "Refs: smoke acceptance for transactional-emails T02 on
  commercejs-cloud.fly.dev" so that path is live-proven. Full T02
  scope closed — next ship is T03 (order confirmation) on
  hosted-checkout finalize.
- **2026-04-21** (late pm): T02 code-complete on all three surfaces.
  `7b60363 feat(platform): password-reset token helpers + password_resets table`
  — shared merchant-branch `password_resets` table with
  `actor_type ('admin' | 'buyer')` discriminator, 6 new domain
  methods (3 admin on `admin/auth.ts` + 3 buyer filling
  [`customers.ts:123`](../../packages/platform/src/domains/customers.ts:123)
  stubs), cross-actor-type rejection in `verify*` helpers,
  async-bcrypt on new paths (existing sync `hashSync`/`compareSync`
  on `customers.login` / `register` kept for a later polish task),
  31 new unit tests, parity 161/161. 1-hour expiry via
  `PASSWORD_RESET_EXPIRY_MINUTES`. `f142cca feat(dashboard): password-reset
  routes + templates + buyer adapter surface` — 2 new templates
  (`admin-password-reset.ts` + `buyer-password-reset.ts`) registered
  in `_render.ts` with HTML-escaped vars + 6 render tests; 6 PUBLIC
  routes (`/api/admin/forgot-password`, `/api/admin/reset/[token]`
  GET + `/complete`, plus `/api/storefront/auth/*` mirrors);
  enumeration-safe `/forgot-password` always 200; session cookies
  issued on complete (merchant-session for admin, `cjs-buyer-session`
  for buyer); `forgotPasswordSchema` + `completePasswordResetSchema`
  shared across both actor types; `adapter.ts` exposes the three
  new buyer methods (kept alongside legacy `forgotPassword`/
  `resetPassword` stubs to avoid a breaking change to
  `@commercejs/types` CommerceAdapter — storefront routes consume
  via `(adapter as any)` until the stubs are retired). `6efb80a
  feat(storefront): password-reset pages (admin + buyer) + forgot-password link`
  — 4 new pages (`/admin/forgot-password` + `/admin/reset/[token]`
  pre-auth, `/account/forgot-password` + `/account/reset/[token]`
  default layout) + "Forgot password?" link under `/admin/login`.
  Remaining: EXPLICIT-GO `fly deploy` + 10-scenario smoke on
  `commercejs-cloud.fly.dev` → T02 → ✅.
- **2026-04-21** (pm): T01 ✅ **Completed** — deployed + smoke-accepted
  end-to-end on `commercejs-cloud.fly.dev` after operator SMTP
  pre-reqs landed (service chosen, credentials provisioned,
  DKIM/SPF/DMARC on `commercejs.cloud`, `fly secrets set SMTP_*`) +
  `fly deploy` + standalone runtime-dep fix `da62205`
  (`@commercejs/notification-smtp` promoted from transitive-only to
  dashboard `dependencies`; the worker process module-load-crashed
  before picking up its first job). Full pipeline proven: enqueue →
  BullMQ → worker → render → SMTP → ImprovMX catch-all → recipient
  inbox with working accept link. Fly-managed Upstash Redis DB in
  `fra` replaces the exhausted free-tier DB (`REDIS_URL` swap via
  `fly secrets set`; no code changes). Scenarios 1–8 all green
  including BullMQ retry-with-backoff on intentional SMTP
  credential corruption. One carry-over documented: orphan
  `invited` rows when the email bounces or is lost — no in-product
  resend button yet; operator-recoverable by deleting and
  re-inviting. T02 (password reset) starts next. Sub-plan T01 row
  flipped 🟢 → ✅; T02 row flipped 🟡 → 🟢 In Progress.
- **2026-04-21** (am): T01 code-complete on `fly/eaas` — four commits:
  `d4b68e2` platform (staff_invites table + token helpers + null-
  password login guard + 19 unit tests), `a5716ea` dashboard (SMTP
  provider singleton + `server/emails/` template system + worker
  handler extraction + 11 tests), `6c16779` dashboard (invite routes
  + audit integration), `5df66eb` storefront (`/admin/invite/[token]
  .vue` pre-auth page + `/admin/staff/new.vue` toggle). T01 status
  flipped 🟡 → 🟢. Acceptance blocks on operator SMTP pre-reqs +
  `fly deploy`; both gated behind EXPLICIT-GO. Full session recap in
  [`.memory/checkpoints/2026-04-21T0353.md`](../../.memory/
  checkpoints/2026-04-21T0353.md).
- **2026-04-20**: Sub-plan created. Research completed (Option A —
  vertical slices per task, staff-invite first). Seven tasks (T01–T07)
  defined; T01 task file spawned alongside this doc with the staff-
  invite first-vertical-slice scope. Provider decision: SMTP via
  `@commercejs/notification-smtp` (nodemailer-backed) — matches the
  existing stub's `SMTP_*` env-var shape, so no secrets reshuffle;
  SMTP service target (SES / Mailgun / Postmark / Resend-SMTP /
  self-hosted) decided in T01 based on cost + deliverability. Resend
  API considered + deferred — SMTP keeps the door open to every
  provider without locking in. No code changes in this commit —
  planning artefacts only. Spawns from
  `.plans/eaas-launch/tasks/T02.md`, which becomes a pointer + status
  mirror.
