# Changelog

All notable changes to the CommerceJS platform are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Individual
`@commercejs/*` packages keep their own Changesets-generated changelogs under
`packages/*/CHANGELOG.md` — this file tracks the product/platform level.

## [Unreleased]

### Added
- Agentic Workflow protocol bootstrap (`docs/WORKFLOW.md`, journey log, status page).

## [2026-04-17] — EaaS live on Fly.io (`fly/eaas`)

### Added
- Multi-tenant EaaS in production: `app.commercejs.cloud` (operator dashboard),
  `*.commercejs.cloud` (per-merchant SSR storefronts), `checkout.commercejs.cloud`
  (hosted checkout) — one Fly app, three supervised processes.
- Per-merchant Neon Postgres provisioning (project-per-merchant) via BullMQ worker.
- Per-event Prisma tenant binding (`registerEventResolver`), merchant staff auth,
  buyer sessions, Tigris S3 media uploads, merchant admin UI (products, orders,
  fulfillment, refunds).

### Changed
- Platform ORM on the EaaS line: Prisma primary (Drizzle retained for `main`).

## [2026-03-10] — Cloudflare-era SDK line (`main`)

### Added
- 18 published `@commercejs/*` packages: unified types, core orchestrator,
  checkout state machine, platform engine (dual ORM), Nuxt module (74 REST
  routes), UI components, Salla + Medusa adapters, Tap payments, Armada/Parcel
  delivery, Resend/SMTP notifications, GA4 analytics, S3 storage, webhook
  verifier, CF cloud orchestration + CLI.
- Documentation site at commerce.js.org (69 pages, llms.txt, MCP toolkit).
- Cross-merchant buyer identity (Profile system) with OTP verification.

[Unreleased]: https://github.com/commerce-js/commerce.js/compare/main...HEAD
