# CommerceJS — Business Plan: EaaS with an Open-Source Core

> The canonical business strategy document. Written 2026-07-02 from a full audit of the
> codebase, npm registry, market data, and the strategy documents in `.plans/` and `.memory/`.
> Companion docs: `.plans/fly-migration-plan.md` (execution), `.plans/post-mortem-eaas-pivot.md`
> (GTM models — now promoted from contingency to active input), `.plans/roadmap.md` (product phases).

---

## 1. The Business in One Paragraph

CommerceJS becomes a **GCC-first eCommerce-as-a-Service** — a merchant signs up, gets a
storefront + admin + API + **dedicated Postgres database**, and starts selling — built on an
**MIT-licensed open-source SDK** that anyone can self-host. The open core is the distribution
funnel and credibility story ("the open-source Salla"); the managed cloud is the revenue.
Salla and Zid prove GCC merchants pay ~SAR 99–100+/mo for this; Medusa proves the
open-core + paid-cloud model in commerce; nobody combines both **with native GCC rails**
(Tap payments = mada/KNET/Benefit/STC Pay/Tabby/Tamara/Apple Pay, Armada/Parcel delivery,
Arabic/RTL, SAR defaults, Bahrain-region hosting).

---

## 2. Assets Audit (what we already own)

### 2.1 Published npm packages — 18, all live, all MIT (verified 2026-07-02)

| Layer | Package | Version | Notes |
|---|---|---|---|
| Foundation | `@commercejs/types` | 0.3.0 | 31 domain type files — the shared language |
| | `@commercejs/core` | 0.3.0 | `createCommerce()`, EventBus, orchestrator, composite/fallback |
| | `@commercejs/checkout` | 2.0.0 | Channel-agnostic state machine, payment links, QR |
| | `@commercejs/webhook-verifier` | 1.1.0 | HMAC verification |
| Engine | `@commercejs/platform` | 0.5.4 | ~9.5k LOC native engine, 15 domains, Admin API, dual ORM |
| Framework | `@commercejs/nuxt` | 0.6.26 | 17 composables, 74 REST routes, Zod, OpenAPI |
| | `@commercejs/ui` | 0.1.6 | 33 Vue components on Nuxt UI v4 |
| Adapters | `@commercejs/adapter-salla` | 0.1.3 | 9+ domains |
| | `@commercejs/adapter-medusa` | 0.2.2 | 7 domains, 44 contract tests |
| Providers | `@commercejs/payment-tap` | 0.1.3 | **Unlocks the full GCC payment rail via Tap aggregation** |
| | `@commercejs/delivery-armada` | 0.2.3 | GCC last-mile |
| | `@commercejs/delivery-parcel` | 0.2.3 | OAuth2 delivery |
| | `@commercejs/notification-resend` | 0.2.2 | Email |
| | `@commercejs/notification-smtp` | 0.2.2 | Email |
| | `@commercejs/analytics-ga` | 0.2.2 | GA4 |
| | `@commercejs/storage-s3` | 0.2.0 | S3/R2/Spaces/MinIO |
| CF-era cloud | `@commercejs/cloud` | 0.2.0 | Frozen — Cloudflare deploy orchestration (main branch only) |
| | `@commercejs/cli` | 0.2.0 | Frozen — deploy/init/env for the CF model |

### 2.2 Applications

| App | State | Business role |
|---|---|---|
| `apps/docs` | 69 pages, auto-deployed to commerce.js.org, llms.txt + MCP | OSS adoption engine — already AI-agent-optimized |
| `apps/dashboard` | CF-coupled control plane (being rebuilt on Fly.io) | **The paid product** |
| `apps/storefront` | Working reference store | Template for merchant storefronts |
| `apps/hosted-checkout` | Payment links, QR, Tap card elements, OTP profiles | Checkout channel + POS story |
| `apps/landing-page`, `pitch-deck`, `cloud-landing-page`, `cloud-pitch-deck` | Static, ready | GTM collateral already exists |

### 2.3 Infrastructure & process

- CI: PR build/typecheck/test; releases via Changesets + **npm OIDC trusted publishing**; docs auto-deploy.
- Knowledge base: `.memory/` (19 locked decisions, gotchas, checkpoints), `.plans/` (locked migration plan).
- Test suite: ~500+ tests across adapters/providers/checkout (gaps: `nuxt`, `ui`, `cli` untested; CI covers 6/18 packages).

### 2.4 Honest traction snapshot

- GitHub: public since 2026-02, **3 stars, 0 forks, 0 issues**.
- npm: downloads negligible (registry-verified packages, no measurable usage).
- Revenue: $0. Users: 0.

**Read:** the asset base is unusually strong for a pre-traction project; distribution is the
entire game from here. The plan sells the *service* first (agency mode), then earns OSS
attention with a real product behind it.

---

## 3. Market

- GCC eCommerce ≈ **USD 177B (2026)**, ~15% CAGR through 2031; Saudi ≈ 34% share; 95%+ internet penetration in KSA/Bahrain. (Mordor/IMARC 2026 estimates.)
- **Salla**: free tier + transaction fees, standard plans from ~SAR 99/mo, Special tier custom. **Zid**: from ~SAR 100/mo. Both Saudi-focused, closed-source, take fees on entry tiers.
- **Shopify**: strong in UAE, weak Arabic/RTL localization and GCC rails; USD pricing + GMV cut via payments.
- **Medusa Cloud**: $29 / $99 / $299 + usage — validates OSS-core monetization; no MENA focus.
- **Buyer segments**: (1) GCC SMB merchants (Salla's market — huge, needs Arabic-first turnkey), (2) GCC dev agencies building client stores (underserved: Salla locks them in, Shopify costs GMV, Medusa needs DevOps), (3) developers wanting a Nuxt-native commerce stack (OSS funnel).

**Positioning: "The open-source Salla."** For merchants: a Salla-class hosted store with
no GMV fees and data ownership (your own database, exportable). For agencies: white-label
EaaS with real code access. For developers: the only MIT commerce stack with GCC rails built in.

---

## 4. Open-Core Boundary (now explicit)

**Open (MIT, published to npm)** — everything a self-hoster needs to run a complete store:
`types`, `core`, `checkout`, `platform` (the full engine), `nuxt`, `ui`, both adapters, all
payment/delivery/notification/analytics/storage providers, `webhook-verifier`. Plus the
reference `storefront` and `hosted-checkout` as templates, and the docs site.

**Proprietary (private in `apps/`, never published)** — everything that makes it a *service*:
the cloud dashboard/control plane, tenant resolution middleware, merchant provisioner,
billing integration, plan enforcement, cloud landing pages.

**Frozen (MIT but not part of the story)**: `@commercejs/cloud` + `@commercejs/cli` — they
orchestrate the abandoned Cloudflare per-store model; kept for `main` compatibility.

**Licensing decision: stay MIT everywhere; no AGPL/BSL relicensing.** Rationale: (a) the moat
is the managed GCC-native service + integrations + data gravity, not code secrecy; (b) Medusa
proves MIT-core + closed-cloud works in commerce; (c) copyleft/source-available would tax the
adoption we don't yet have. Revisit only if a hyperscaler clones the cloud (a good problem).
The README's "premium adapters may use a separate commercial license" language is replaced by
this clear boundary.

---

## 5. Product & Pricing Ladder

| Tier | Price | Limits / features |
|---|---|---|
| **OSS self-host** | Free forever | Full engine, bring your own infra; docs + community support |
| **Trial** | Free 14 days | Full features, subdomain, watermark, 10 products |
| **Starter** | **$9/mo** (SAR 34) | 100 products, 500 orders/mo, subdomain store, Tap payments |
| **Pro** | **$29/mo** (SAR 109) | Unlimited products/orders, custom domain, delivery integrations, 5 GB media |
| **Business** | **$79/mo** (SAR 299) | + analytics, API keys, webhooks, priority support, 50 GB |
| **Enterprise / Agency** | Custom | Dedicated Neon project, SLA, white-label, SSO |

- **No GMV / transaction fees, ever** — the wedge against Salla/Zid/Shopify. Merchants keep their margin; we keep pricing predictable.
- Display pricing in SAR first (schema defaults are already `SAR`/`ar-SA`).
- **Agency services** (day-1 revenue, per `.plans/post-mortem-eaas-pivot.md`): setup $500–1k basic / $2–5k custom / $5–15k enterprise; retainers $49 (hosting) / $149 (managed) / $299 (full service). Agency clients live on the same platform under `dashboard_role: client`.
- Later: partner program (20% affiliate / 30% reseller / 40% agency partner).

---

## 6. Unit Economics

Per-merchant marginal cost (shared Fly app + DB-per-merchant on Neon + Upstash):

| Item | Cost/merchant/mo |
|---|---|
| Fly compute share (4× shared-1x @ 100 merchants) | ~$0.20 |
| Neon branch (scale-to-zero, ~$1.50 beyond included) | ~$1.50 |
| Upstash Redis share | ~$0.05 |
| Egress/misc | ~$0.25 |
| **Total** | **~$2.00** |

→ Gross margin: **78% at Starter ($9)**, **93% at Pro ($29)**, **97% at Business ($79)**.
Fixed base: ~$5–10/mo (control DB, always-on machine) — irrelevant past 2 merchants.
Solo-founder OpEx ≈ $0. Repo's own projections (post-mortem doc): combined MRR
$3.4k (M1, agency-led) → $10k (M6) → $30k (M12). Treat as targets, not forecasts.

**Scaling watch-items:** Neon ~50 branches/project → provisioner shards across projects
(architecture supports it: `neonProjectId` per merchant); heavy merchants graduate to
dedicated projects (Enterprise tier covers the cost).

---

## 7. Go-To-Market (sequenced, cash-flow-first)

1. **Ship agency-mode EaaS** — ✅ LIVE: `app.commercejs.cloud` (dashboard), `*.commercejs.cloud`
   (per-merchant SSR storefronts), `checkout.commercejs.cloud` (hosted checkout) on Fly.io. Remaining:
   the M0 hardening ports (tests, API keys, provisioner robustness) + redeploy.
2. **Pilot: 3 hand-provisioned merchants** (validation gate from the pivot plan). Charge setup fees even in pilot — $500 basic. Proves provisioning, uncovers real merchant needs.
3. **Landing + waitlist** at the apex domain using the existing `cloud-landing-page` asset; 5 merchant interviews ("would you pay $29/mo?").
4. **Self-serve layer**: public signup, **Tap subscription billing** (Tap, not Stripe — `Merchant.tapCustomerId` is already plumbed and Tap carries the GCC rails: mada, KNET, Benefit, Tabby, Tamara), transactional email, templates, plan enforcement.
5. **OSS launch push** — only after the cloud is real (per checkpoint: "ship Fly.io EaaS → then the open-source story becomes credible"): Show HN, Nuxt/Vue newsletters and community, MENA dev communities (Arabic dev YouTube/Telegram), llms.txt/MCP angle for AI-agent commerce. Goal: stars → self-hosters → cloud converts.
6. **Agency channel**: pitch GCC web agencies white-label EaaS (their brand, our platform, 40% share) — the segment Salla structurally can't serve.

**KPIs / gates:** 3 pilot stores live → first paying merchant → 10 external OSS users →
$1k MRR → decide: double-down vs re-scope (backup options in `.plans/post-mortem-backup-plan.md`
remain the documented fallback).

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Distribution is zero; OSS launch may fizzle | Agency revenue doesn't depend on OSS traction; launch only with a live product; docs/llms.txt already best-in-class |
| Salla/Zid feature breadth (apps marketplace, financing) | Don't fight feature-for-feature; wedge = no GMV fees + data ownership + agencies/devs |
| Solo-founder bus factor | `.memory`/`.plans` discipline; MIT core means nothing is trapped |
| Platform Prisma parity drift | Parity script in CI path; this build closes the known gaps (profile models, OTP queries) |
| Neon project/branch quotas & cost creep | Live model is project-per-merchant; adopt branch-sharding (45/project) when nearing account project quota; per-merchant cost tracked; Enterprise tier absorbs dedicated projects |
| Fly single-region latency/outage | Production runs `fra` today; owner decision pending on adding/migrating to `bah` for GCC latency; Neon is a separate failure domain |
| Payment UX still card-centric | Tap hosted page already exposes local methods; per-method flows scheduled post-MVP |

---

## 9. Roadmap (canonical milestones — see `.plans/grand-plan.md`)

| # | Milestone | Owner of the work |
|---|---|---|
| M0 | Harden the live `fly/eaas` line: infra tests, API-key issuance, provisioner robustness (`provisionError`/retries), Neon delete-leak fix, runbook | AI sessions |
| M0.5 | Docs + CLAUDE.md + CI reorganization | AI sessions |
| M1 | Redeploy hardened branch; region decision (`fra` live vs `bah` target) | Owner + AI |
| M2 | 3 paid pilot merchants (agency mode) — the V5→V6 gate | Owner (sales) |
| M3 | Self-service: public signup + Tap subscription billing + email + plan enforcement | AI sessions |
| M4 | OSS launch (Show HN, Nuxt/MENA communities) | Owner + AI prep |
| M5 | $1k MRR gate → double-down vs re-scope | Owner decision |

Sessions run under the Agentic Workflow protocol — `docs/WORKFLOW.md` (stage: V5).
