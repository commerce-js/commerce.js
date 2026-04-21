// ---------------------------------------------------------------------------
// POST /api/admin/reset/:token/complete — consume an admin reset token
// ---------------------------------------------------------------------------
//
// PUBLIC — no session required. On success, issues the merchant session
// cookie so the admin lands inside /admin without a second login.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { parseOrThrow } from '../../../../utils/admin-validate'
import { completePasswordResetSchema } from '../../../../utils/admin-schemas'
import { setMerchantSession } from '../../../../utils/merchant-session'
import { recordActivity } from '../../../../utils/audit'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  const merchant = event.context.merchant
  if (!admin || !merchant) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Reset token is required' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(completePasswordResetSchema, body)

  let user
  try {
    user = await admin.auth.completeAdminPasswordReset(token, input.password)
  }
  catch (err: any) {
    const msg = err?.message ?? 'Could not reset password'
    throw createError({ statusCode: 400, statusMessage: 'Bad request', message: msg })
  }

  await setMerchantSession(event, {
    userId: user.id,
    merchantId: merchant.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role,
  })

  await recordActivity(event, 'auth.password_reset_completed', 'auth', user.id, {
    email: user.email,
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
})
