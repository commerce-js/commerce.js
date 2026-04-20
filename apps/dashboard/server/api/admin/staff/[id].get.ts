// ---------------------------------------------------------------------------
// GET /api/admin/staff/:id — fetch one staff user
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  try {
    return await admin.auth.getAdmin(id)
  }
  catch (err: any) {
    const msg = err?.message ?? 'Not found'
    if (/not found/i.test(msg)) {
      throw createError({ statusCode: 404, statusMessage: 'Not found', message: msg })
    }
    throw createError({ statusCode: 400, statusMessage: 'Bad request', message: msg })
  }
})
