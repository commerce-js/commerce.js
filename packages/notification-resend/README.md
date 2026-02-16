# @commercejs/notification-resend

Resend email notification provider for CommerceJS.

[![npm](https://img.shields.io/npm/v/@commercejs/notification-resend?color=CB3837)](https://www.npmjs.com/package/@commercejs/notification-resend)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@commercejs/notification-resend` implements the `NotificationProvider` interface using [Resend](https://resend.com) for email delivery. Register it in `createCommerce()` with notification rules to send emails on commerce events (order confirmations, shipping updates, etc.).

## Install

```bash
npm install @commercejs/notification-resend resend
```

## Quick Start

```typescript
import { createCommerce } from '@commercejs/core'
import { createResendProvider } from '@commercejs/notification-resend'

const commerce = createCommerce({
  adapter,
  notifications: {
    resend: createResendProvider({
      apiKey: 're_...',
      from: 'My Store <noreply@mystore.com>',
    }),
  },
  notificationRules: [
    {
      event: 'order.created',
      channel: 'email',
      provider: 'resend',
      buildMessage: (payload) => ({
        to: payload.order.customer.email,
        subject: `Order #${payload.order.id} confirmed`,
        data: { order: payload.order },
      }),
    },
  ],
})
```

## Configuration

| Option | Type | Required | Description |
|---|---|---|---|
| `apiKey` | `string` | ✅ | Resend API key |
| `from` | `string` | ✅ | Sender address (e.g. `"Store <noreply@example.com>"`) |
| `replyTo` | `string` | — | Reply-to address for all emails |
| `client` | `Resend` | — | Custom Resend client (overrides `apiKey`) |

## Supported Channels

This provider supports the `email` channel only. Attempts to send through other channels (`sms`, `push_web`, etc.) return `{ success: false, error }`.

## Error Handling

The provider never throws. All errors are returned as `{ success: false, error: string }`:

- Unsupported channel → rejected immediately
- Missing recipient → rejected immediately
- Resend API error → error message from Resend
- Network/runtime error → exception message

## Exports

| Export | Type | Description |
|---|---|---|
| `createResendProvider` | Function | Create a Resend-backed notification provider |
| `ResendProviderConfig` | Type | Configuration interface |

## Documentation

Full docs at [commerce.js.org](https://commerce.js.org)

## License

[MIT](../../LICENSE)
