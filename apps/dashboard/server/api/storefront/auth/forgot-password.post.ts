// ---------------------------------------------------------------------------
// POST /api/storefront/auth/forgot-password — buyer password-reset request
// ---------------------------------------------------------------------------
//
// PUBLIC — no buyer session required. Always returns 200 `{ok: true}`
// regardless of whether the email matches a customer row, to avoid
// enumeration.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError, getRequestHost, getRequestProtocol } from 'h3'
import { parseOrThrow } from '../../../utils/admin-validate'
import { forgotPasswordSchema } from '../../../utils/admin-schemas'
import { enqueueMerchantJob } from '../../../utils/queue'

export default defineEventHandler(async (event) => {
  const adapter = event.context.adapter as any
  const merchant = event.context.merchant
  if (!adapter || !merchant) {
    throw createError({ statusCode: 500, statusMessage: 'Storefront context missing' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(forgotPasswordSchema, body)
  const email = input.email.toLowerCase().trim()

  const result = await adapter.requestPasswordReset(email)

  if (result) {
    const host = getRequestHost(event, { xForwardedHost: true })
    const proto = getRequestProtocol(event, { xForwardedProto: true })
    const resetUrl = `${proto}://${host}/account/reset/${result.token}`

    await enqueueMerchantJob({
      type: 'send-email',
      data: {
        merchantId: merchant.id,
        to: email,
        template: 'buyer-password-reset',
        vars: {
          storeName: merchant.name,
          resetUrl,
          expiresAt: result.expiresAt.toISOString(),
        },
      },
    })
  }

  return { ok: true }
})
