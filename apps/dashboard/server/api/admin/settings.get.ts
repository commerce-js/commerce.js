// ---------------------------------------------------------------------------
// GET /api/admin/settings — fetch the merchant's store settings
// ---------------------------------------------------------------------------

import { defineEventHandler, createError } from 'h3'
import { requireMerchantSession } from '../../utils/merchant-auth'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  return admin.getStoreSettings()
})
