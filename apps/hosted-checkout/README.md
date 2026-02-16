# CommerceJS Hosted Checkout

Deployable checkout application with embedded Tap card elements — works as a standalone payment page for any CommerceJS-powered store.

## Overview

The hosted checkout is a Nuxt application that provides a complete, drop-in checkout experience. Merchants redirect customers here to collect payment details, process cards via Tap Payments (with 3DS support), and handle payment callbacks. It uses the `@commercejs/checkout` state machine and `@commercejs/payment-tap` provider under the hood.

## Features

- **Embedded card form** — Tap card elements render inline (no redirect to Tap)
- **3DS support** — Handles full 3D Secure flow with redirect and callback
- **Webhook verification** — Validates Tap webhook signatures for payment confirmation
- **Responsive design** — Mobile-first, works on any device
- **Error handling** — Displays user-friendly error messages for declined cards and API failures

## Setup

```bash
# From the monorepo root
pnpm install

# Start dev server
cd apps/hosted-checkout
pnpm dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `TAP_SECRET_KEY` | Tap secret key (`sk_test_...` or `sk_live_...`) |
| `TAP_PUBLISHABLE_KEY` | Tap publishable key (`pk_test_...` or `pk_live_...`) |
| `WEBHOOK_SECRET` | Secret for verifying Tap webhook signatures |

## Dependencies

| Package | Role |
|---|---|
| `@commercejs/checkout` | Checkout state machine |
| `@commercejs/payment-tap` | Tap Payments provider |
| `@commercejs/webhook-verifier` | Webhook signature verification |
| `@commercejs/types` | Shared types |

## License

[MIT](../../LICENSE)
