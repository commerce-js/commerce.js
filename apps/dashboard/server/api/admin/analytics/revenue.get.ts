// ---------------------------------------------------------------------------
// GET /api/admin/analytics/revenue?granularity=&from=&to=
// Zero-filled time series bucketed by day / week / month.
// ---------------------------------------------------------------------------

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { analyticsRangeSchema } from '../../../utils/admin-schemas'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const params = parseOrThrow(analyticsRangeSchema, getQuery(event))
  return admin.getRevenueTimeSeries({
    granularity: params.granularity,
    from: params.from,
    to: params.to,
  })
})
