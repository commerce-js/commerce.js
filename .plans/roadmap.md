# CommerceJS — Roadmap & Backlog

> Architecture vision + prioritized feature backlog

---

## 🏗️ Architecture Vision

> CommerceJS is a **composable commerce orchestrator** — not a monolithic adapter.

```
┌─────────────────────────────────────────────────────────┐
│               CommerceOrchestrator                      │
│                                                          │
│   catalog → Salla    customers → HubSpot CRM            │
│   cart    → Medusa   payments  → Stripe / Tap / SoftPOS │
│   events  → EventBus (keeps everything in sync)         │
└─────────────────────────────────────────────────────────┘
```

**Core principles:**
- **Composable adapters** — mix data from different sources per domain
- **Universal Checkout** — channel-agnostic state machine (web, mobile, POS, AI)
- **Pluggable payments** — gateway providers separate from checkout flow
- **Event-driven sync** — real-time coordination between adapters

---

## 🎯 Phase 1: Prove the Contract *(Current)*

**Goal:** Make adapters composable, tested, and trustworthy.

- [ ] Refactor `CommerceAdapter` → `CommerceOrchestrator` (composable sub-adapters)
- [ ] Add `PaymentProvider` interface (extracted from checkout)
- [ ] Add capabilities system (`adapter.supports('cart')`)
- [ ] Contract test suite (`@commercejs/test-utils`)
- [ ] Mapper unit tests for `adapter-salla`

---

## 🎯 Phase 2: Universal Checkout + Second Adapter

### Universal Checkout (`@commercejs/checkout`)
- [ ] Checkout state machine (cart → address → shipping → payment → confirm)
- [ ] Payment gateway registry (pluggable providers)
- [ ] Channel-agnostic (web, mobile, POS, AI agent)
- [ ] Embeddable with single line of code

### Second Adapter: Medusa (`@commercejs/adapter-medusa`)
- [ ] Full storefront API (cart, checkout, customer built-in)
- [ ] Proves portability of the type system
- [ ] Reference "full-stack" adapter

---

## 🎯 Phase 3: DX & Developer Tools

- [ ] OpenAPI 3.1 spec auto-generation from routes + types
- [ ] CLI tool for adapter scaffolding + contract testing
- [ ] READMEs and getting started guide
- [ ] Postman collection

---

## 🎯 Phase 4: Future Vision

### SoftPOS Mobile Payments
- [ ] `@commercejs/payment-softpos` — NFC tap-to-pay provider
- [ ] `@commercejs/payment-cash` — cash handling for POS
- [ ] `@commercejs/pos` — POS mobile app (Capacitor/RN)

### Event Stream / Webhooks
- [ ] `@commercejs/event-bus` — real-time events + multi-adapter sync
- [ ] SSE endpoint in core module
- [ ] Webhook dispatch mechanism

### Agentic Commerce
- [ ] `@commercejs/mcp-server` — MCP server wrapping adapter contract
- [ ] `llms.txt` / `agents.json` discovery
- [ ] A2A protocol support

### Other
- [ ] Multi-market / multi-currency support
- [ ] Drop-in commerce components (`@commercejs/drop-in`)
- [ ] Promotion rules engine (JSON DSL)
- [ ] Metrics / analytics API

---

## ✅ Completed

- [x] `@commercejs/types` — 15+ domain types, 15 sub-adapter interfaces
- [x] `@commercejs/core` — Nuxt module, 16 composables, 38 API routes
- [x] `@commercejs/adapter-salla` — catalog, orders, reviews, promotions, store info
- [x] Token refresh (server-only, Option A)
- [x] Storefront — live pages with real Salla data

---

## Change Log

- **2026-02-08**: Initial roadmap from Commerce Layer analysis
- **2026-02-09**: Architecture vision added (orchestrator, Universal Checkout, SoftPOS)
- **2026-02-09**: Roadmap restructured into phased approach
