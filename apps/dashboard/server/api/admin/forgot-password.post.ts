// ---------------------------------------------------------------------------
// POST /api/admin/forgot-password — admin password-reset request (pre-auth)
// ---------------------------------------------------------------------------
//
// PUBLIC — no session required. Always returns 200 `{ok: true}` regardless
// of whether the email matches an admin_users row, to avoid user-
// enumeration leaks. When the row exists, the platform generates a
// single-use token and we enqueue the email dispatch through the same
// BullMQ pipeline T01 established.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError, getRequestHost, getRequestProtocol } from 'h3'
import { parseOrThrow } from '../../utils/admin-validate'
import { forgotPasswordSchema } from '../../utils/admin-schemas'
import { enqueueMerchantJob } from '../../utils/queue'
import { recordActivity } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  const merchant = event.context.merchant
  if (!admin || !merchant) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(forgotPasswordSchema, body)
  const email = input.email.toLowerCase().trim()

  const result = await admin.auth.requestAdminPasswordReset(email)

  if (result) {
    const host = getRequestHost(event, { xForwardedHost: true })
    const proto = getRequestProtocol(event, { xForwardedProto: true })
    const resetUrl = `${proto}://${host}/admin/reset/${result.token}`

    await enqueueMerchantJob({
      type: 'send-email',
      data: {
        merchantId: merchant.id,
        to: email,
        template: 'admin-password-reset',
        vars: {
          storeName: merchant.name,
          resetUrl,
          expiresAt: result.expiresAt.toISOString(),
        },
      },
    })

    // Audit row with actorId=null (pre-auth) + actorEmail = the requested
    // address so we have a forensic trail regardless of outcome.
    await recordActivity(event, 'auth.password_reset_requested', 'auth', null, {
      email,
      expiresAt: result.expiresAt.toISOString(),
    })
  }

  return { ok: true }
})
