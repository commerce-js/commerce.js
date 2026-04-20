// ---------------------------------------------------------------------------
// GET /api/admin/inventory — low-stock products under ?threshold= (default 10)
// ---------------------------------------------------------------------------

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { lowStockQuerySchema } from '../../../utils/admin-schemas'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const params = parseOrThrow(lowStockQuerySchema, getQuery(event))
  return admin.getLowStockProducts(params.threshold)
})
