// ---------------------------------------------------------------------------
// GET /api/admin/reset/:token — validate an admin password-reset token
// ---------------------------------------------------------------------------
//
// PUBLIC — no session required. Missing / expired / used all collapse
// into a single 404 so token-probing can't leak existence.
// ---------------------------------------------------------------------------

import { defineEventHandler, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 404, statusMessage: 'Reset link not found' })
  }

  const result = await admin.auth.verifyAdminPasswordResetToken(token)
  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Reset link not found' })
  }

  return {
    email: result.email,
    expiresAt: result.expiresAt.toISOString(),
  }
})
