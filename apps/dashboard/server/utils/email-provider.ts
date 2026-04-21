// ---------------------------------------------------------------------------
// SMTP provider singleton — thin wrapper around @commercejs/notification-smtp
// ---------------------------------------------------------------------------
//
// Lazy: throws at first `send()` call time (not at import time) so tests
// and the worker boot in environments without the credentials still work.
// The worker dispatches through this provider; dashboard HTTP routes don't
// send directly — they enqueue a `send-email` job instead.
// ---------------------------------------------------------------------------

import { createSmtpProvider } from '@commercejs/notification-smtp'
import type { NotificationProvider } from '@commercejs/types'

let _provider: NotificationProvider | null = null

/**
 * Return the singleton SMTP provider. Reads `SMTP_HOST`, `SMTP_PORT`
 * (default 587), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_REPLY_TO`
 * from `process.env`. Throws a descriptive error if any required var is
 * missing — the worker's retry policy will back off and surface the
 * failure in the BullMQ logs.
 *
 * `secure` is auto-derived: port 465 → true (implicit TLS), anything else
 * → false (STARTTLS). Most transactional providers use 587; SES SMTP
 * supports both.
 */
export function getEmailProvider(): NotificationProvider {
  if (_provider) return _provider

  const host = process.env.SMTP_HOST
  const port = Number.parseInt(process.env.SMTP_PORT ?? '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM
  const replyTo = process.env.SMTP_REPLY_TO

  if (!host) throw new Error('SMTP_HOST is required')
  if (!user || !pass) throw new Error('SMTP_USER and SMTP_PASS are required')
  if (!from) throw new Error('SMTP_FROM is required (e.g. "CommerceJS Cloud <no-reply@commercejs.cloud>")')
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`SMTP_PORT is invalid: ${process.env.SMTP_PORT}`)
  }

  _provider = createSmtpProvider({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from,
    ...(replyTo ? { replyTo } : {}),
  })
  return _provider
}

/** Reset the singleton — test-only hook. */
export function resetEmailProvider(): void {
  _provider = null
}
