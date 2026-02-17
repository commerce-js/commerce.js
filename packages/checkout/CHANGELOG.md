# @commercejs/checkout

## 2.0.0

### Patch Changes

- Updated dependencies [[`3c539a5`](https://github.com/commerce-js/commerce.js/commit/3c539a51746d02d2643b25a5dbb041abc143928b)]:
  - @commercejs/types@0.3.0

## 1.1.1

### Patch Changes

- Updated dependencies [[`e72ed4a`](https://github.com/commerce-js/commerce.js/commit/e72ed4a76e85f8b81e6d285150d152562c2626b9)]:
  - @commercejs/types@0.2.1

## 1.1.0

### Minor Changes

- [`056262f`](https://github.com/commerce-js/commerce.js/commit/056262f02a5e9868edd609e1b6104f2b7ed68475) Thanks [@masterde](https://github.com/masterde)! - Channel-agnostic checkout: support for web, POS, AI agent, and payment link channels

  - Added `CheckoutChannel` type (`'web' | 'pos' | 'agent' | 'link'`)
  - Added `CheckoutFulfillment` type (`'shipping' | 'local_delivery' | 'pickup' | 'none'`)
  - Dynamic state transitions via `buildTransitions(fulfillment)` — skips address step for pickup/none
  - Smart config defaults via `resolveConfig()` — POS defaults to no-shipping, web defaults to shipping
  - Session TTL via `expiresIn` config + `assertNotExpired()` guard + `expired` event
  - Updated `CheckoutSnapshot` with `channel`, `fulfillment`, and `expiresAt` fields

## 1.0.0

### Patch Changes

- Updated dependencies [[`8adbefb`](https://github.com/commerce-js/commerce.js/commit/8adbefbbce1d9c24c55ea2c9e8a6daa7bbb204a5)]:
  - @commercejs/types@0.2.0

## 0.1.1

### Patch Changes

- [`3d174af`](https://github.com/commerce-js/commerce.js/commit/3d174afdff5b81f2d735ccd6b990d9a88ce8f819) Thanks [@masterde](https://github.com/masterde)! - Handle instant payment declines (failed/cancelled) immediately instead of waiting for confirmation
