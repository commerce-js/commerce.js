# The Workflow — one agentic protocol from idea to viable product

One workflow that can take any project from a raw idea to a working, viable
product — and keep evolving it. Two halves:

- **The venture lifecycle (§0)** — the stages a product moves through, each with
  an exit gate and the four quality pillars (§0.2: UX, DX, Security, Efficiency)
  enforced as gates, not aspirations.
- **The execution machinery (§1–§8)** — how any individual piece of work gets
  done: altitudes, session lifecycle, mission trio, checkpoints, roles.

Authority order: explicit user instruction > this document > tool defaults.
The human owner (**HITL** — see §10) is the only merge/deploy authority for the
default branch.

## 0. The venture lifecycle — idea → viable product

Every project is at exactly one stage; name it before routing work. Stage exits
are GATES: human go/no-go where marked, reviewer-verified otherwise. Skipping a
gate is a logged deviation, not a shortcut.

| Stage | Produces | Exit gate |
|---|---|---|
| **V0 Idea & validation** | `docs/product/idea.md`: problem, who pays, why now, riskiest assumption, kill criteria, cheapest test of the assumption — informed by the `researcher` agent (evidence for AND against) | **Human go/no-go.** No code before this exists — an unvalidated idea is cheapest to kill in prose |
| **V1 Definition** | PRD + MVP scope (what's deliberately OUT), user journeys with acceptance criteria, data-model sketch, stack decision with rationale; brand/UX directions from the `designer` agent for the owner to choose; business model + pricing proposal from the `business` agent (`docs/product/business/`) — the model shapes scope and the data model | Stop-the-line: no implementation without acceptance criteria. **Human approves scope** (with the business model and the brand direction) |
| **V2 Foundation** | Deployable skeleton (`devops` lays CI + deploy): repo + CI gates (test/typecheck), deploy pipeline + health/ready checks, validated env with a **fail-closed production guard**, auth decision wired, error-monitoring hook, seed/reset path, README quickstart, chosen design system as tokens | "Hello world" **deployed and live-verified**; CI green. Security and DX are laid here — retrofitting costs 10× |
| **V3 Build (MVP)** | The product, feature by feature, via the execution machinery (§1–§5). Every checkpoint applies the pillar lenses | All MVP acceptance criteria met; behavioral/eval suite exists for AI-driven products |
| **V4 Hardening** | Four explicit audits (§0.2): security review, UX pass, DX pass, efficiency pass — plus ops readiness (backups, monitoring, runbook, guard coverage). Audits run as an **adversarial multi-vote** (§5): lens-partitioned parallel reviewers, conservative merge | Reviewer-verified production-readiness checklist (full seven-lens scorecard); findings fixed or accepted in writing |
| **V5 Launch** | Production deploy (`devops` prepares, `/release` cuts the version), first-user onboarding, **live end-to-end verification on the deployed instance**, monitoring confirmed receiving events, rollback tested; launch assets from the `marketing` agent under `docs/product/launch/` (one file per deliverable: positioning, landing copy, per-channel announcements, post-launch content plan, indexed by `launch-plan.md` with the channel plan) — **the human publishes**; pricing finalized against measured costs and the executive summary refreshed (`business`) | Pre-launch **multi-vote review** (§5) green; first real user/business served. **Human owns the launch decision** |
| **V6 Operate & evolve** | Growth is *users and features*: funnel/channel review against the launch metrics (`marketing`) beside feedback → ranked feature ideas → user-reviewed → growth missions (phased trio with locked decisions); ops review of errors/costs; retros that amend THIS document | Continuous — each growth mission re-cycles V3–V5 gates |

A stage may be revisited (a pivot reopens V0/V1; a big growth mission re-runs V4
before its launch). The stages sequence the *product*; the altitudes (§1)
sequence the *work inside a stage*.

### 0.2 The four pillars — enforced, not aspirational

Standing rules (checked at every checkpoint by the reviewer) plus a dedicated
audit each at V4. When a pillar conflicts with speed, the pillar wins at V4/V5
and speed wins at V0–V2 prototyping — say which mode you're in.

**UX** — *the product tells the truth and never dead-ends.*
- Every view handles empty / loading / error states; empty states point at the
  primary action.
- The UI never claims what the backend doesn't confirm (no "Synced" while
  disconnected; status derives from the same source the backend trusts).
- No mock/scaffold data reachable in production builds; no dead controls.
- Verified in a **real client** (real browser for web — clean console,
  hydration-safe SSR with no locale/timezone formatting in server HTML;
  keyboard + label + contrast basics).
- Copy is in the user's language and register.

**DX** — *a stranger clones the repo and ships a fix the same day.*
- README quickstart with few commands incl. a one-command dev datastore;
  `.env.example` that works as-is.
- Gates are fast and local (unit tests need no live services); the conventions
  file and docs index kept truthful — the stale-doc rule (§8) is enforced.
- Useful scripts documented; a CONTRIBUTING that states the CI gates and footguns.
- Agent-DX counts too: pre-resolved briefs, a code index if available,
  reusable test patterns — the repo is legible to humans and models alike.

**Security** — *fail closed, least privilege, independently reviewed.*
- Misconfiguration must refuse to serve, not silently degrade (a production
  guard that validates required config at boot; signature/token checks fail
  closed; route/authorization classification is exact).
- Least privilege: scoped CI permissions, pinned third-party actions touching
  secrets, hashed credentials, secrets encrypted at rest with a rotation story,
  additive-only migrations by default.
- Rate-limit every public/credential surface; close self-serve sign-up unless
  the product needs it; audit trail on privileged state changes.
- Independent security lens at every checkpoint; full review at V4 and for any
  auth/payment/webhook/CI-touching change.

**Efficiency** — *measure first; spend where users feel it; don't overbuild.*
- MVP scope discipline: a written "NOT in this version" list (deferred ≠ denied);
  simple infra until scale is a measured problem.
- Perf budgets on hot paths; no N+1s on list endpoints; caching only with an
  invalidation story.
- Cost awareness for AI products: model tiering (cheap router → strong executor),
  token/context budgets (§2, principle 2), per-feature spend visibility.
- Agent efficiency: route to the smallest altitude that fits (§1); reuse
  existing engines before building new ones.

## 1. Three altitudes — route every piece of work first

| Altitude | Trigger | Process | Overhead |
|---|---|---|---|
| **Task** | Typo-class fix, config tweak, single-file bug with an obvious test | Branch → fix → verify → PR | Minutes |
| **Session** | One sitting of focused work: a feature slice, a bug hunt, a refactor | Session lifecycle (§4) | One branch, one PR |
| **Mission** | Too big for one sitting: multi-feature, migration, audit | Plan trio + phases + checkpoints (§5) | `.plans/` ledger, reviewer gates |

Name the stage (§0), then route. When unsure between Session and Mission: if you
cannot pre-resolve all file targets in one exploration pass, it's an Mission.
Escalating mid-flight is fine (log it); silently sprawling is not.

## 2. Principles

1. **The ledger outlives the transcript.** Durable state lives in files
   (`.plans/<mission>.state.md` for missions; PRs/issues for sessions), never only
   in chat. Any fresh agent must resume from files alone.
2. **Ingest conclusions, not corpora.** Delegate high-volume reading to subagents
   that return distilled results. Budget ≤30% of the context window per session
   (~1,500 lines of reads); grep-first ranged reads for files >400 lines.
3. **Retrieval-first.** If a code index exists, use it before grep + whole-file
   reads for where/what/blast-radius questions.
4. **Gates, not logs.** Verification returns a signal (green/red + first error),
   never pasted build output. The project's gates are in §10.
5. **Verify live, in a real client.** Anything with a runtime surface gets
   exercised end-to-end — for web UI a real browser, not a status-code ping.
6. **Independence at the gates.** Work is reviewed by an agent that did not write
   it (fresh context) at every checkpoint and before any risky merge. Self-review
   only for Task-altitude changes, labeled "Self-QA (non-independent)".
7. **Evidence where reviewers look.** Decisions, deviations, verification results
   go on the PR/issue/ledger — the system of record.
8. **Crash-safe by write-ahead.** State updates are written before ending a
   session, so interruption never loses or doubles work.

## 3. Guardrails (mechanical, always on)

Shipped by this plugin as hooks. Advisory except where marked:

| Event | Behavior |
|---|---|
| Prompt submit | Reminder when the working tree is on the default branch |
| `git commit` | Conventional-format reminder |
| `git push` | **BLOCKS** any push while on the default branch (feature branches only) |
| `git push` | Warns when tracked files are modified-but-uncommitted (untracked scratch dirs don't warn) |
| `gh pr create` | Reminder to have run the gates |
| `Write`/`Edit` | Reminder to update docs when high-impact files change |

Blockers exit 2 (hard stop); reminders exit 0. Guardrails catch autopilot
mistakes; they never replace judgment.

## 4. Session lifecycle (the default altitude)

**Open** — route the work (§1); create/checkout the branch (never the default
branch); if part of a mission, read the ledger → `Next up:` → that brief.

**Work** — smallest change meeting the acceptance criteria; follow repo
conventions (the project's conventions file is the engineering source of truth);
tests accompany behavior changes; deviations from a brief are allowed but MUST be
logged in the ledger.

**Close** — gates green (§10); live verification if there's a runtime surface
(§2, principle 5); commit (`type(scope): description` — for mission sessions
`<mission>(S<n>): summary`); push the branch; PR with summary + test plan;
**update the record** (§6.1 — spawn the `chronicler` agent, then republish the
owner status page); **never merge the default branch yourself** — HITL merges
(merging often auto-deploys).

**Context discipline** — at ~25% usage, finish the current edit to a compiling
state, verify, write the handoff, end. A clean half-session beats a degraded full
one. Finished early (<15%)? Pull the next same-phase brief (checkpoints always
end a session).

## 5. Mission lifecycle (multi-session work)

The plan trio, written by a dedicated planning session:

| File | Job |
|---|---|
| `.plans/<mission>.md` | Master plan: numbered tasks with acceptance criteria, **locked decisions (dated)**, risks, open questions each with a recommendation |
| `.plans/<mission>.sessions.md` | One brief per session: pre-resolved reads (file → measured line count → anchors), do/verify steps, read budget; phases with named branches |
| `.plans/<mission>.state.md` | Ledger: checklist, deviations log, handoff log (≤10 lines each, newest first), `Next up:` |

Rules: briefs pre-resolve targets so execution sessions never explore; one branch
per phase, merged at checkpoint per the **gate policy** below; migrations and
CI/deploy-touching changes get extra checkpoint scrutiny; **one-corrective-retry**
— a failing session/agent is retried once with a corrective note, then escalated
to the human.

**Gate policy** (chosen at mission start; default `human-merge`):
- `human-merge` — on APPROVE, pause for HITL to merge each phase branch.
- `batch` — on APPROVE, the orchestrator merges the phase branch into a
  long-lived `mission/<name>-integration` branch — **never the default branch**,
  so the push-block guardrail (§3) and the merge authority (§11 safety boundary)
  stay intact — and HITL merges the integration branch once, at the batched
  end-of-mission (or launch) confirmation. Used by `/autopilot` when the flight
  plan says "only stop at hard gates".

**Checkpoints** end every phase: the independent `reviewer` agent (fresh context)
re-runs all gates, diff-reviews `base..head`, performs deferred manual/live items,
checks claimed deviations against the actual diff, restores datastore state (§10),
and returns APPROVE / REQUEST CHANGES with concrete findings plus a **scorecard**
(per-lens 0–3; at routine checkpoints only the lenses the diff touched — the
binary verdict stays the gate signal, scores are diagnostics for the pillar-health
panel). Review fixes land as their own ledger entries (`S<n>-fix`).

**Adversarial multi-vote — high-stakes gates only.** At exactly two lifecycle
points — the V4 audit and the pre-launch (V5) review — the orchestrator spawns
2–3 fresh `reviewer` instances, lens-partitioned (security + efficiency /
UX + DX / QA + architecture), instead of one. Merge conservatively: any
REQUEST CHANGES blocks; findings are unioned; the same finding from two
reviewers raises its confidence. Routine checkpoints stay single-reviewer —
this is where review cost is spent deliberately, not everywhere.

The trio is authored by the `planner` agent and driven by the bundled `/mission`
command (plan · run · continue). The `planner` explores once and pre-resolves
every brief's targets; `/mission` orchestrates execution phase by phase, spawning
specialist implementers per brief and the `reviewer` at each checkpoint.

## 6. Roles

| Role | Who | Duty |
|---|---|---|
| **Implementer** | The main session agent, or a **specialist implementer** subagent (`backend`, `frontend`, `security`) — used for a domain slice or to run slices in parallel in a mission | Route, build to convention, verify, document, hand off |
| **Reviewer** | The `reviewer` agent — always a fresh context | Checkpoint reviews; pre-merge review of risky changes; five pillar lenses + QA + architecture in one pass |
| **Chronicler** | The `chronicler` agent | Keeps the record (§6.1); documents, never touches product code |
| **HITL** | The human owner (§10) | Answers open questions, merges the default branch, owns deploys and anything irreversible |

**Specialist implementers** carry their domain's pillar bias — `backend`
(data integrity, idempotency, migrations, efficiency), `frontend` (the UX pillar,
real-client verification), `security` (fail-closed hardening, least privilege),
`devops` (CI/CD pipelines, deploy config, releases, rollback).
They compose with, and never replace, independent review: a specialist BUILDS,
the fresh-context `reviewer` VERIFIES. No specialist self-approves, merges, or
pushes the default branch. Reach for them when a session has a clear single-domain
slice, or when a mission has parallel slices that can run at once; a plain session
on the main agent is fine for small or cross-cutting work.

**Researcher** (`researcher`) works upstream of code, in V0: it validates the
problem, sizes the market, maps competitors, and pressure-tests the riskiest
assumption with cited evidence for AND against, drafting `docs/product/idea.md`.
Like the reviewer, its value is independence — it hunts disconfirming evidence
rather than selling the idea. It informs the human's go/no-go; it never decides.

**Planner** (`planner`) decomposes an already-decided mission into the `.plans/`
trio, doing the expensive exploration once so execution sessions never do. It
pre-resolves every brief's targets and sizes them to the context budget; it does
tactical decomposition, not strategic scope (main session + HITL own that). Driven
by `/mission`.

**Designer** (`designer`) works at V1–V2 and for redesigns: it surfaces several
distinct brand/UX directions for the owner to choose from, then organizes the
chosen one into a design-token system the `frontend` agent implements. It
proposes and organizes; the owner picks; frontend builds.

**Marketing** (`marketing`) works at V5–V6: it turns the V0 evidence and the PRD
into launch assets under `docs/product/launch/`, one file per deliverable —
positioning (statement, ICP, pillars), landing-page copy, per-channel
announcement drafts in the owner's voice, a post-launch content plan, and a
`launch-plan.md` index carrying the channel plan and launch metrics. At V6 it
reviews the funnel, keeps the content plan current, and proposes channel
experiments as growth-mission candidates. Its copy is product-truthful (claims
trace to evidence or shipped behavior). It drafts; the **human publishes** —
outward publishing sits on the safety boundary (§11).

**Business** (`business`) owns the venture's viability math and business
documents (`docs/product/business/`): the business model (value metric, revenue
model, cost to serve, unit economics), the pricing strategy, and a one-page
executive summary refreshed at every stage transition. It proposes at V1
(model + pricing hypothesis with the PRD), finalizes against measured costs at
V4–V5, and proposes pricing experiments at V6. It proposes with evidence from
the V0 research; the **human decides** model and prices — and it never spends
or charges (§11 safety boundary).

**DevOps** (`devops`) owns the delivery pipeline as a first-class artifact —
CI/CD, GitHub Actions workflows, deploy config, environments, releases, rollback.
It lays the pipeline at V2 and prepares the launch at V5, co-owning CI security
posture with `security`. It prepares deploys/releases; the human fires the
irreversible ones (see §11).

### 6.1 Documentation of record (Chronicler)

Three artifacts kept current so the project's story survives any single session:

- **`CHANGELOG.md`** — technical, Keep-a-Changelog format, PR-referenced.
- **`docs/product/JOURNEY.md`** — posterity, plain-language narrative, append-only.
- **`docs/product/overview.html`** — the owner's **live status page**: current
  stage, work in flight, owner action items, pillar health, timeline. Self-
  contained HTML published as a Claude Artifact to a stable URL (recorded in the
  file's `artifact-url` comment) the owner keeps bookmarked.

**When**: at session close, at every checkpoint, and at stage transitions. The
implementer spawns the chronicler with a summary (PRs, deviations, incidents, any
stage change); the chronicler edits the three files, then the **main session
republishes** `overview.html` via the Artifact tool to its recorded URL
(subagents cannot publish artifacts). Task-altitude changes update CHANGELOG only.

## 7. Fulfilment: definition of done

DONE = gates green → live verification passed (real client for UI) → docs updated
when behavior/config changed → PR merged by HITL → **post-deploy verification on
the deployed instance** for anything user-facing. "Deployed and verified" is the
finish line, not "PR open".

## 8. Evolution: the loop that improves the loop

- **Retro** after significant missions: what to keep/change lands as edits to THIS
  document or the guardrails — via PR like any other change.
- **Lessons become memory or docs**: project-derivable facts → repo docs;
  agent-behavioral lessons → auto-memory. Never both.
- **Stale-doc rule**: any session that catches docs lying about the code fixes it
  in the same PR.
- **Harness changes are code**: hooks, commands, agents, and this protocol are
  versioned and reviewed like source.

## 9. How this maps to the plugin

- Agents ship with the plugin: `researcher` (V0 validation), `designer`
  (V1–V2 brand/UX), `business` (V1/V5/V6 model, pricing, business documents),
  `planner` (mission decomposition), `marketing` (V5–V6 go-to-market),
  `reviewer`, `chronicler`, and the specialist implementers `backend`,
  `frontend`, `security`, `devops` (CI/CD, deploy, releases).
- Guardrail hooks (§3) install automatically.
- Commands: `/init-workflow` (bootstrap a project into this workflow),
  `/autopilot` (drive an idea to launch-ready, §11), `/mission` (plan + drive a
  multi-session mission), `/release` (cut a version), `/start-work`,
  `/check-workflow`, `/pre-pr`, `/end-work`, `/quick-fix`, `/retro`.
- The `protocol` skill points every session at the project's
  `docs/WORKFLOW.md` (or this master if none exists yet).
- Templates for the status page, `idea.md`, `flight-plan.md`, `decision-log.md`,
  the launch asset set (`launch-plan.md`, `launch-positioning.md`,
  `launch-landing-page.md`, `launch-announcement.md`, `launch-content-plan.md`),
  the business set (`business-executive-summary.md`, `business-model.md`,
  `business-pricing.md`), and this protocol live under the plugin's `templates/`.

## 10. Project profile (filled by `/init-workflow`, 2026-07-02)

| Key | Value |
|---|---|
| **HITL (merge/deploy authority)** | Baker (`masterde`, baker@xyz.dev) |
| **Default branch** | `main` (Cloudflare-era legacy). Active EaaS line: `fly/eaas` role — current work branch `claude/ecommerce-saas-planning-mus9v7`; owner merges/renames after review |
| **Test gate** | `pnpm vitest run` (root projects incl. platform + dashboard) |
| **Typecheck/lint gate** | `pnpm turbo run build typecheck --filter='!@commercejs/dashboard' --filter='!docs'` (CI-equivalent) + `bash packages/platform/scripts/check-query-parity.sh` → "in sync" |
| **Build** | `pnpm build` (turbo); product: `pnpm --filter @commercejs/dashboard build` (nuxt + `.output/worker.mjs`) |
| **Datastore seed/reset** | Merchant DBs: programmatic `migratePrisma(client)` + `seedPrisma(client)` at provision time (never at request time). Control DB: `apps/dashboard/prisma/migrations` via `prisma migrate deploy`. Local: `packages/platform` `db:migrate:seed` |
| **Deploy + live-verify** | Manual `fly deploy` (root `fly.toml`/`Dockerfile`; app `commercejs-cloud`, region `fra`, 3 processes via `scripts/start-web.sh`). Live-verify: `GET https://app.commercejs.cloud/api/_health` + provision a smoke merchant → `https://<sub>.commercejs.cloud`. CI deploy workflow planned (M0.5) |
| **Eval suite** (behavioral, if any) | none yet — worker `--dry-run` + boot-smoke curls serve as runtime checks (see `.memory/` verification matrix) |
| **High-impact files** (docs-reminder targets) | `CLAUDE.md`, `.plans/grand-plan.md`, `.plans/business-plan.md`, `.memory/decisions.md`, `packages/platform/src/database/prisma/schema/`, `apps/dashboard/server/utils/{tenant,neon,merchant-provisioner}.ts` |
| **Issue tracker** | GitHub Issues (`commerce-js/commerce.js`) via GitHub MCP tools — no `gh` CLI in remote sessions |

**Current stage: V5 — deployed, hardening, pre-users.** Production is live
(`app.commercejs.cloud` + tenant storefronts + hosted checkout) with no external
merchants yet. Next stage gate: 3 paid pilot merchants (V6 = operate & grow).
Milestone roadmap: `.plans/grand-plan.md`; business strategy: `.plans/business-plan.md`.

## 11. Autopilot mode

`/autopilot "<idea>"` drives the whole lifecycle (V0→V5, then a V6 handoff) with
the bare-minimum human input — validation, definition, design choice, foundation,
build, hardening, and launch-prep — pausing only at the gates a human must own.
It's the same workflow, orchestrated end-to-end instead of session-by-session.
Autopilot does not run V6 operations; at the launch gate it hands the owner a V6
operating brief (feedback channels, ranked growth backlog, retro cadence) and ends.

**The only upfront ask is a flight plan** (`docs/product/flight-plan.md`, from the
bundled template): the idea, a budget ceiling, risk tolerance, a brand preference
(or "you choose"), the deploy target, and how often to check in. That is the
standing authorization; anything outside it returns to the human. The check-in
level also selects the mission **gate policy** (§5): "check in each stage" keeps
the default `human-merge` at every phase; "only hard gates" authorizes `batch` —
phases merge autonomously into a mission integration branch (never the default
branch) and the human merges once, at the consolidated launch confirmation.

**What runs autonomously**: the reviewer-verified stage gates. The `researcher`
validates (and can auto-stop on kill criteria); the `designer` picks a direction
if pre-authorized; the `business` agent proposes model and pricing (V1) for the
human to approve with scope; `devops` lays the pipeline (V2) and stages the
release (V5); `marketing` drafts the launch assets (V5) for the human to publish;
`backend`/`frontend`/`security` build with a `reviewer` checkpoint per phase
(one corrective retry, then surface); the `chronicler` keeps the status page live
as the owner's window; a `decision-log.md` records every autonomous choice and
how to reverse it.

**The safety boundary is never crossed autonomously** — even here, these need an
explicit human confirmation each time (pre-authorization lets you *prepare*, not
*fire*): merging the default branch, deploying to production / going live,
spending beyond the flight-plan ceiling, publishing outward or messaging on the
owner's behalf, and destructive/irreversible actions. These are **batched**: at
the launch boundary the human gets ONE consolidated "ready to launch" summary to
confirm, not a stream of interruptions.

Autopilot mode is therefore *autonomous up to the reversible boundary*, with the
irreducible human decisions collapsed to the fewest, best-informed touchpoints.
