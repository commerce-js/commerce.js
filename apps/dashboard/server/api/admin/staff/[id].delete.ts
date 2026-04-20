// ---------------------------------------------------------------------------
// DELETE /api/admin/staff/:id — remove a staff user (owner-only)
// ---------------------------------------------------------------------------
//
// Server-side "can't delete yourself" guard covers the common UI foot-gun.
// The last-owner guard is enforced by the platform's deleteAdmin — we just
// map its 400 message through.
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireOwner } from '../../../utils/require-role'

export default defineEventHandler(async (event) => {
  const session = await requireOwner(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  if (id === session.userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      message: 'You cannot remove your own staff account',
    })
  }

  try {
    await admin.auth.deleteAdmin(id)
    return { ok: true }
  }
  catch (err: any) {
    const msg = err?.message ?? 'Could not delete staff user'
    if (/not found/i.test(msg)) {
      throw createError({ statusCode: 404, statusMessage: 'Not found', message: msg })
    }
    throw createError({ statusCode: 400, statusMessage: 'Bad request', message: msg })
  }
})
