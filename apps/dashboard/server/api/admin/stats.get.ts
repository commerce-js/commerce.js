// ---------------------------------------------------------------------------
// GET /api/admin/stats — dashboard summary for the admin landing page
// ---------------------------------------------------------------------------
//
// Thin wrapper over event.context.admin.getDashboardStats(). Tenant middleware
// has already bound this merchant's Prisma client and built the AdminAPI
// domain closures, so the only work left is session enforcement + passthrough.
// ---------------------------------------------------------------------------

import { defineEventHandler, createError } from 'h3'
import { requireMerchantSession } from '../../utils/merchant-auth'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  return admin.getDashboardStats()
})
