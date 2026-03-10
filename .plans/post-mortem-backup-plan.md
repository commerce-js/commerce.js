# ⚠️ POST-MORTEM BACKUP PLAN — Do Not Use for Active Development

> [!CAUTION]
> **THIS IS A POST-MORTEM CONTINGENCY PLAN.**
> It exists only as a fallback if the current CommerceJS Cloud vision (Phase 7+) fails to reach viability.
> **Do NOT reference this plan for active sprint planning, feature work, or roadmap decisions.**
> The active roadmap is at [roadmap.md](roadmap.md).

---

## Purpose

If we determine that the full CommerceJS Cloud platform (hosted infrastructure, billing, multi-tenant dashboard) is not viable — due to market timing, resource constraints, or technical debt — this plan captures how to maximize the value of everything we've already built.

The goal is **not** to abandon work but to **pivot the packaging** so that the significant engineering investment (16 published npm packages, 2 adapters, universal checkout, delivery providers, analytics, notifications, storage) delivers value in a different form.

---

## What We Have (Asset Inventory)

### Published npm Packages (16)

| Package | What It Does | Standalone Value |
|---------|-------------|-----------------|
| `@commercejs/types` | 26+ domain types, 18+ sub-adapter interfaces | ⭐ High — reusable contract for any commerce project |
| `@commercejs/core` | `createCommerce()`, EventBus, Orchestrator factories | ⭐ High — runtime engine, works without Cloud |
| `@commercejs/nuxt` | Nuxt module, 16 composables, 46 REST routes, Zod validation | ⭐ High — drop-in commerce for any Nuxt app |
| `@commercejs/adapter-salla` | Full Salla storefront API (9 domains) | ⭐ High — valuable for MENA ecommerce |
| `@commercejs/adapter-medusa` | Medusa V2 storefront API (7 domains, 44 tests) | ⭐ High — Medusa is popular, adapter is proven |
| `@commercejs/checkout` | Checkout state machine | ⭐ High — channel-agnostic, reusable |
| `@commercejs/platform` | Built-in commerce engine (SQLite/Drizzle + Neon Postgres) | ⭐ High — self-hosted commerce backend |
| `@commercejs/payment-tap` | Tap Payments provider | Medium — region-specific |
| `@commercejs/delivery-armada` | Armada last-mile delivery (19 tests) | Medium — region-specific |
| `@commercejs/delivery-parcel` | Parcel delivery with OAuth2 (23 tests) | Medium — region-specific |
| `@commercejs/webhook-verifier` | Cryptographic webhook verification | Medium — utility |
| `@commercejs/notification-resend` | Resend email provider (9 tests) | Medium — pluggable |
| `@commercejs/notification-smtp` | SMTP email provider (11 tests) | Medium — pluggable |
| `@commercejs/analytics-ga` | Google Analytics 4 provider (12 tests) | Medium — pluggable |
| `@commercejs/storage-s3` | S3-compatible storage (20 tests) | Medium — pluggable |
| `@commercejs/cloud` | Cloud infrastructure orchestration | ❌ Low — only useful with Cloud platform |
| `@commercejs/cli` | CLI tool (deploy, init, env) | ❌ Low — coupled to Cloud |

### Applications (private, not published)

| App | What It Does | Standalone Value |
|-----|-------------|-----------------|
| `storefront` | Reference Nuxt storefront | ⭐ High — showcase / template |
| `hosted-checkout` | Deployable checkout with Tap card elements | ⭐ High — works independently |
| `docs` | Documentation site (commerce.js.org) | ⭐ High — essential for OSS |
| `dashboard` | Cloud dashboard MVP | ❌ Low — only useful with Cloud |
| `@commercejs/ui` | 17 component domains | Medium — tied to storefront |

### Infrastructure & Knowledge

- Contract test suite + mapper unit tests (258+ lines)
- CI/CD: release workflow, docs deployment, changeset versioning
- 15 architectural decisions documented in `.memory/decisions.md`
- 14 hard-won gotchas in `.memory/gotchas.md`
- OpenAPI spec with Scalar UI for all 46 routes

---

## Pivot Options (Ranked by Effort vs. Impact)

### Option A: Pure Open-Source SDK (Lowest effort)

**Thesis:** CommerceJS is already a strong open-source commerce SDK. Drop the Cloud ambitions, focus on the SDK + adapters.

**What to do:**
1. Archive `@commercejs/cloud`, `@commercejs/cli`, and the `dashboard` app
2. Move `storefront` to a public template repo (`commercejs/storefront-template`)
3. Publish `hosted-checkout` as a standalone deployable
4. Write a "self-host on Cloudflare" guide (the infra knowledge already exists in gotchas/decisions)
5. Focus marketing on: "composable commerce SDK for Nuxt — bring your own backend"
6. Expand adapter ecosystem (Shopify, WooCommerce, BigCommerce)

**Revenue model:** None (pure OSS) or sponsorships / consulting

**Timeline:** 1–2 weeks to clean up and repackage

---

### Option B: Adapter Marketplace / Templates (Medium effort)

**Thesis:** Sell premium adapters, starter templates, and hosted checkout as products.

**What to do:**
1. Everything in Option A, plus:
2. Create premium adapters (Shopify, BigCommerce) as paid packages
3. Sell the storefront as a premium Nuxt UI template ($49–$149)
4. Offer `hosted-checkout` as a managed service ($X/month for hosted payment links)
5. Build a simple landing page with Stripe checkout for template purchases

**Revenue model:** Template sales + premium adapter licenses + hosted checkout SaaS

**Timeline:** 3–4 weeks

---

### Option C: Developer Tools / DX Play (Medium effort)

**Thesis:** The OpenAPI spec, contract tests, and type system are the real assets. Package them as developer tooling.

**What to do:**
1. Extract the adapter contract + contract test suite into `@commercejs/adapter-kit`
2. Build a CLI that scaffolds new adapters from the contract (like `create-adapter-salla`)
3. Publish the OpenAPI spec as a standalone reference
4. Position as "the standard interface for commerce APIs" — like Passport.js but for ecommerce
5. Write adapters for popular platforms to prove the standard

**Revenue model:** OSS standard + consulting, or enterprise support contracts

**Timeline:** 4–6 weeks

---

### Option D: MENA-Focused Commerce (Pivot the market, not the tech)

**Thesis:** Salla adapter + Tap Payments + Armada delivery = unique MENA commerce stack. No Western competitor has this.

**What to do:**
1. Rebrand or sub-brand for MENA market
2. Package `adapter-salla` + `payment-tap` + `delivery-armada` as a cohensive solution
3. Build Arabic RTL storefront template (the infrastructure is RTL-ready)
4. Partner with Salla, Tap, and Armada for co-marketing
5. Offer setup-as-a-service for MENA merchants

**Revenue model:** Agency services + recurring hosting fees

**Timeline:** 4–6 weeks

---

## What to Deprecate

Regardless of chosen pivot:

| Asset | Action |
|-------|--------|
| `@commercejs/cloud` | Archive — too coupled to full Cloud vision |
| `@commercejs/cli` | Archive or simplify to just `init` command |
| `dashboard` app | Archive or strip to a simple admin UI |
| Phase 7 Cloud roadmap items | Mark as "deferred indefinitely" |
| D1 schema (projects, deployments, env vars) | Archive — dashboard-specific |
| Cloudflare Queues provisioning code | Archive — deploy-specific |
| GitHub Actions auto-deploy pipeline | Keep if doing Option A/B (template deploys) |

---

## What to Preserve (Non-Negotiable)

These assets are valuable regardless of direction:

1. **The type system** (`@commercejs/types`) — this is the foundation of everything
2. **The adapter pattern** — composable sub-interfaces are architecturally sound
3. **Both adapters** (Salla + Medusa) — prove the pattern works with real APIs
4. **The Nuxt module** — drop-in value for any Nuxt developer
5. **The checkout state machine** — channel-agnostic, well-tested
6. **All provider packages** — payments, delivery, notifications, analytics, storage
7. **The documentation site** — essential for any open-source play
8. **Contract tests** — they enforce adapter quality
9. **The `.memory/` knowledge base** — 15 decisions + 14 gotchas = irreplaceable project wisdom

---

## Trigger Criteria

Consider activating this plan if **two or more** of the following become true:

- [ ] Phase 7 Sprint 2 has not started within 4 weeks of Sprint 1 completion
- [ ] End-to-end deploy flow (create project → live storefront) cannot be demonstrated reliably
- [ ] No external users have deployed via the Cloud platform within 8 weeks
- [ ] Development resources are redirected to other priorities
- [ ] A competitor (Medusa Cloud, Shopify Hydrogen) captures the target market segment first

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-10 | Plan created | Insurance against Cloud vision stalling; maximize ROI on 16 packages + 4 apps already built |

