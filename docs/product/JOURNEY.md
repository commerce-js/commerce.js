# Product Journey

A dated, plain-language log of where the product is and what changed. Newest first.

## 2026-07-02 — Two builds become one; the business gets a plan

Where things stand today:

**The product is live but unlaunched.** CommerceJS Cloud runs in production on
Fly.io — an operator creates a merchant in the dashboard at app.commercejs.cloud,
a background worker provisions a dedicated Neon Postgres database, and the
merchant gets an SSR storefront at `<name>.commercejs.cloud` plus a hosted
checkout. No external merchants use it yet; billing, public signup, and
transactional email don't exist yet. That's the gap between "deployed" and
"business".

**The strategy is now written down.** A full business plan
(`.plans/business-plan.md`) commits the project to an open-core model: the 18
MIT npm packages are the adoption funnel; the managed GCC-first cloud (no GMV
fees, Tap payment rails, Arabic-first) is the revenue. Pricing $9/$29/$79,
~$2/merchant/mo infra cost, agency-first go-to-market with three paid pilot
merchants as the first gate.

**An interesting week:** the EaaS was accidentally built twice in parallel — the
owner's `fly/eaas` branch (richer merchant-facing surface, now canonical) and an
AI session's branch (tests, API-key issuance, provisioner hardening, runbook —
now being ported in). The reconciliation plan, roadmap M0–M5, and this workflow
bootstrap are the current work.

**Next:** finish the hardening ports (M0), reorganize docs/CI (M0.5), then the
owner starts pilot-merchant conversations while self-service (signup + Tap
subscriptions + email) is built (M3).
