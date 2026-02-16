# @commercejs/notification-smtp

SMTP email notification provider for [CommerceJS](https://github.com/commerce-js/commerce.js).

Uses [nodemailer](https://nodemailer.com) to deliver emails via any standard SMTP server — Gmail, Amazon SES, Postfix, Mailgun, or your own mail server.

## Installation

```bash
pnpm add @commercejs/notification-smtp
```

## Usage

```ts
import { createSmtpProvider } from '@commercejs/notification-smtp'

const smtp = createSmtpProvider({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: 'you@gmail.com', pass: 'app-password' },
  from: 'My Store <noreply@mystore.com>',
})
```

### With CommerceJS

```ts
import { createCommerce } from '@commercejs/core'

const commerce = createCommerce({
  adapter,
  notifications: { smtp },
  notificationRules: [
    {
      event: 'order.created',
      channel: 'email',
      provider: 'smtp',
      template: 'order_confirmation',
      buildMessage: (payload) => ({
        to: payload.order.customer.email,
        subject: 'Order confirmed',
        html: '<h1>Thank you for your order!</h1>',
      }),
    },
  ],
})
```

## Configuration

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `host` | `string` | Yes | — | SMTP server hostname |
| `port` | `number` | Yes | — | SMTP port (587 TLS, 465 SSL, 25 plain) |
| `secure` | `boolean` | No | `false` | Use implicit TLS (port 465) |
| `auth` | `{ user, pass }` | No | — | SMTP credentials |
| `from` | `string` | Yes | — | Default sender address |
| `replyTo` | `string` | No | — | Reply-to address |
| `connectionTimeout` | `number` | No | `10000` | Connection timeout (ms) |
| `socketTimeout` | `number` | No | `10000` | Socket timeout (ms) |

## Common SMTP Servers

| Provider | Host | Port | Secure |
|---|---|---|---|
| Gmail | `smtp.gmail.com` | 587 | `false` |
| Amazon SES | `email-smtp.{region}.amazonaws.com` | 587 | `false` |
| Outlook | `smtp-mail.outlook.com` | 587 | `false` |
| Mailgun | `smtp.mailgun.org` | 587 | `false` |
| Custom | Your server | 25/587/465 | Varies |

## Testing

```bash
pnpm vitest run
```

11 tests covering send success, plain text, HTML, multipart, reply-to, channel rejection, missing fields, auth errors, transport errors, and custom message IDs.

## License

MIT
