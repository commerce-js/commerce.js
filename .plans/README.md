# Planning Docs — Index

This directory holds the project's planning and strategy documents. Start every
session at **[`grand-plan.md`](grand-plan.md)** — it's the orientation doc
(vision, architecture, current phase). Everything else is either a still-useful
reference or archived history.

Legend: ✅ shipped · 🟡 in flight · 📚 reference · 🗄️ archived

## 🟢 Active

The doc you read first, and the plans tracking work in flight.

| Doc | What it is |
|---|---|
| [`grand-plan.md`](grand-plan.md) | **Session entry point.** Vision (three pillars), architecture at a glance, phase status, live deployments, State Snapshot. Phase-granular; the specific plans below win on detail. |
| [`roadmap.md`](roadmap.md) | Master 7-phase roadmap + prioritized backlog (Phase 6 future vision, Billing/email TODOs) + full change log. |

## 📚 Reference — executed, still consulted

Plans whose work has shipped but that remain the authoritative record of *how*
a subsystem is built. Kept in place because the code still lives by them.

| Doc | Status | What it covers |
|---|---|---|
| [`fly-migration-plan.md`](fly-migration-plan.md) | ✅ | Fly.io EaaS infrastructure (Steps 1–8) — the LOCKED migration that took the platform off Cloudflare. |
| [`storefront-eaas/`](storefront-eaas/) | ✅ | Hosted storefront layer (T01 API routes → T04 co-supervised SSR) + composable rewrite. |
| [`merchant-admin/`](merchant-admin/) | ✅ | Merchant-facing admin UI (T01 auth → T05 orders). All five tasks shipped. |
| [`marketing.md`](marketing.md) | 📚 | Positioning / go-to-market notes (MENA-first, open-core boundary). |

## 🗄️ Archived — [`archive/`](archive/)

Superseded, contingency, or fully-executed-and-closed docs. Retained for history;
not part of the current plan of record.

| Doc | Why archived |
|---|---|
| [`archive/provider-swap-flyio.md`](archive/provider-swap-flyio.md) | Lighter "swap providers only" alternative to the full Fly.io EaaS migration — not the path taken. |
| [`archive/post-mortem-eaas-pivot.md`](archive/post-mortem-eaas-pivot.md) | Contingency blueprint for the EaaS multi-tenant pivot — since executed on `fly/eaas`. |
| [`archive/post-mortem-backup-plan.md`](archive/post-mortem-backup-plan.md) | Contingency plan for if the Cloud vision stalled. |
| [`archive/phase-1-composable-contract/`](archive/phase-1-composable-contract/) | Phase 1 — adapter contract (shipped). |
| [`archive/phase-2-sdk-quality/`](archive/phase-2-sdk-quality/) | Phase 2 — SDK quality & DX (shipped). |
| [`archive/phase-3-architecture-evolution/`](archive/phase-3-architecture-evolution/) | Phase 3 — orchestrator + providers (shipped). |
| [`archive/phase-4-checkout-medusa/`](archive/phase-4-checkout-medusa/) | Phase 4 — universal checkout + Medusa adapter (shipped). |
| [`archive/phase-7-cloud/`](archive/phase-7-cloud/) | Original Cloudflare-era Phase 7 Cloud plan — superseded by `fly-migration-plan.md` + `storefront-eaas/` + `merchant-admin/`. |
| [`archive/commercejs-next-phase/`](archive/commercejs-next-phase/) | Early "what's next" scoping — superseded by the roadmap. |
| [`archive/storefront/`](archive/storefront/) | Original reference-storefront plan — superseded by `storefront-eaas/`. |
| [`archive/diagram-brief.md.resolved`](archive/diagram-brief.md.resolved) | One-off diagram brief, resolved. |

---

> **Maintenance.** When a plan finishes, move it from Active → Reference (if the
> code still lives by it) or into `archive/` (if it's history). Keep this index
> and `grand-plan.md`'s phase table in sync, in the same commit as the work.
