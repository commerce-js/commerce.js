// ---------------------------------------------------------------------------
// GET /api/admin/categories — flat list for the product form's multi-select
// ---------------------------------------------------------------------------

import { defineEventHandler, createError } from 'h3'
import { requireMerchantSession } from '../../utils/merchant-auth'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  return admin.listCategories()
})
