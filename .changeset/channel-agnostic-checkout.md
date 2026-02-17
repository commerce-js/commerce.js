---
"@commercejs/checkout": minor
---

Channel-agnostic checkout: support for web, POS, AI agent, and payment link channels

- Added `CheckoutChannel` type (`'web' | 'pos' | 'agent' | 'link'`)
- Added `CheckoutFulfillment` type (`'shipping' | 'local_delivery' | 'pickup' | 'none'`)
- Dynamic state transitions via `buildTransitions(fulfillment)` — skips address step for pickup/none
- Smart config defaults via `resolveConfig()` — POS defaults to no-shipping, web defaults to shipping
- Session TTL via `expiresIn` config + `assertNotExpired()` guard + `expired` event
- Updated `CheckoutSnapshot` with `channel`, `fulfillment`, and `expiresAt` fields
