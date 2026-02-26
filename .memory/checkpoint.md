# Checkpoint

**Latest:** [2026-02-26T0800](checkpoints/2026-02-26T0800.md)

## Summary
Delivery integration Phase 2 complete. Hosted checkout deployed. Storefront checkout has delivery toggle + map. Stale cart bug fixed.

## Next
- Top up Armada merchant balance → end-to-end delivery test
- Dashboard delivery tracking UI (show delivery status when orders come in)
- Add `GOOGLE_MAPS_KEY` to Cloudflare Pages env vars for both projects
- Webhook handling for Armada status updates → order status in DB

| Timestamp | Summary | Details |
|:---|:---|:---|
| 2026-02-26T08:00 | Delivery Phase 2: hosted checkout deployed, storefront delivery added, stale cart fix | [Full checkpoint](checkpoints/2026-02-26T0800.md) |
| 2026-02-25T05:40 | Dependency audit complete. Drizzle 0.45, Neon 1.0, module-builder 1.0, vitest 4.0. All tests pass. | [Full checkpoint](checkpoints/2026-02-25T0540.md) |
| 2026-02-24T05:20 | Storefront search + polish: SearchPalette, ILIKE search, currency fix, Tailwind cleanup | [Full checkpoint](checkpoints/2026-02-24T0520.md) |
| 2026-02-23T09:00 | Delivery provider integration: core wiring, Nuxt routes, hosted-checkout endpoints | [Full checkpoint](checkpoints/2026-02-23T0900.md) |
| 2026-02-22T10:30 | Saved card flow complete. 6 root causes fixed. SDK init consolidated. | [Full checkpoint](checkpoints/2026-02-22T1030.md) |
| 2026-02-22T01:27 | Profile API routes + OTP verification flow complete. 5 tables in Neon. | [Full checkpoint](checkpoints/2026-02-22T0127.md) |
| 2026-02-22T01:13 | Profile schema, types, queries, domain, and migration complete. | [Full checkpoint](checkpoints/2026-02-22T0113.md) |
| 2026-02-22T00:56 | Cloud-first vision finalized. Profile naming decided. Dev workflow created. | [Full checkpoint](checkpoints/2026-02-22T0056.md) |
