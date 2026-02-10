# @commercejs/webhook-verifier

Cryptographic webhook signature verification with built-in provider formatters.

[![npm](https://img.shields.io/npm/v/@commercejs/webhook-verifier?color=CB3837)](https://www.npmjs.com/package/@commercejs/webhook-verifier)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@commercejs/webhook-verifier` provides a simple, secure way to verify that incoming webhooks are authentic. It supports multiple signature algorithms (HMAC-SHA256, HMAC-SHA512) and handles the provider-specific payload formatting that makes webhook verification tricky.

## Install

```bash
npm install @commercejs/webhook-verifier
```

## Quick Start

```typescript
import { WebhookVerifier } from '@commercejs/webhook-verifier'

const verifier = new WebhookVerifier({
  secret: process.env.WEBHOOK_SECRET!,
  algorithm: 'sha256',
})

// In your webhook handler
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const signature = getHeader(event, 'x-signature')

  const result = verifier.verify({
    payload: body,
    signature: signature!,
  })

  if (!result.valid) {
    throw createError({ statusCode: 401, message: 'Invalid webhook signature' })
  }

  // Process the verified webhook
  handleWebhook(body)
})
```

## API

### `WebhookVerifier`

```typescript
const verifier = new WebhookVerifier({
  secret: string       // Your webhook signing secret
  algorithm: string    // 'sha256' | 'sha512'
})
```

#### `verify(payload: WebhookPayload): VerificationResult`

Verifies the signature of an incoming webhook.

```typescript
interface WebhookPayload {
  payload: string | object  // Raw body or parsed object
  signature: string         // Signature from the request header
}

interface VerificationResult {
  valid: boolean
}
```

## Security

- **Timing-safe comparison** — Uses constant-time comparison to prevent timing attacks
- **Multiple algorithms** — Supports HMAC-SHA256 and HMAC-SHA512
- **Zero dependencies** — Uses only Node.js built-in `crypto` module

## Documentation

Full docs at [commerce.js.org](https://commerce.js.org)

## License

[MIT](../../LICENSE)
