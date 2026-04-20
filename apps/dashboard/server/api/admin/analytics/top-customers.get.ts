// ---------------------------------------------------------------------------
// GET /api/admin/analytics/top-customers?limit=&from=&to=
// Top-N customers by lifetime value, excluding cancelled + refunded orders.
// ---------------------------------------------------------------------------

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { topAnalyticsQuerySchema } from '../../../utils/admin-schemas'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const params = parseOrThrow(topAnalyticsQuerySchema, getQuery(event))
  return admin.getTopCustomers({
    limit: params.limit,
    from: params.from,
    to: params.to,
  })
})
