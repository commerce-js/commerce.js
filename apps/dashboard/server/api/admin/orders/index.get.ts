// ---------------------------------------------------------------------------
// GET /api/admin/orders — paginated list with status / date / search filters
// ---------------------------------------------------------------------------

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { listOrdersQuerySchema } from '../../../utils/admin-schemas'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const params = parseOrThrow(listOrdersQuerySchema, getQuery(event))

  return admin.listOrders({
    page: params.page,
    perPage: params.perPage,
    status: params.status,
    customerId: params.customerId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    search: params.search,
  })
})
