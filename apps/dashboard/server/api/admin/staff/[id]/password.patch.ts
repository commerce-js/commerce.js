// ---------------------------------------------------------------------------
// PATCH /api/admin/staff/:id/password — change own password
// ---------------------------------------------------------------------------
//
// Scoped to "change YOUR OWN password" — the route id must match the session
// actor id. Owners wanting to reset a peer's password should delete + recreate
// with a new local password until the email-workstream plan ships a proper
// reset-token flow.
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireMerchantSession } from '../../../../utils/merchant-auth'
import { parseOrThrow } from '../../../../utils/admin-validate'
import { changeStaffPasswordSchema } from '../../../../utils/admin-schemas'

export default defineEventHandler(async (event) => {
  const session = await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  if (id !== session.userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'You can only change your own password',
    })
  }

  const body = await readBody(event)
  const input = parseOrThrow(changeStaffPasswordSchema, body)

  try {
    await admin.auth.changePassword(id, input.currentPassword, input.newPassword)
    return { ok: true }
  }
  catch (err: any) {
    const msg = err?.message ?? 'Could not change password'
    if (/incorrect/i.test(msg)) {
      throw createError({ statusCode: 400, statusMessage: 'Bad request', message: msg })
    }
    if (/not found/i.test(msg)) {
      throw createError({ statusCode: 404, statusMessage: 'Not found', message: msg })
    }
    throw createError({ statusCode: 400, statusMessage: 'Bad request', message: msg })
  }
})
