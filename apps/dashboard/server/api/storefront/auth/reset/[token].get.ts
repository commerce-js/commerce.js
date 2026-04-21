// ---------------------------------------------------------------------------
// GET /api/storefront/auth/reset/:token — validate a buyer reset token
// ---------------------------------------------------------------------------

import { defineEventHandler, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const adapter = event.context.adapter as any
  if (!adapter) {
    throw createError({ statusCode: 500, statusMessage: 'Storefront context missing' })
  }

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 404, statusMessage: 'Reset link not found' })
  }

  const result = await adapter.verifyPasswordResetToken(token)
  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Reset link not found' })
  }

  return {
    email: result.email,
    expiresAt: result.expiresAt.toISOString(),
  }
})
