// ---------------------------------------------------------------------------
// GET /api/admin/products — paginated list with search + status filter
// ---------------------------------------------------------------------------

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { listProductsQuerySchema } from '../../../utils/admin-schemas'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const params = parseOrThrow(listProductsQuerySchema, getQuery(event))

  return admin.listProducts({
    page: params.page,
    perPage: params.perPage,
    search: params.search,
    status: params.status,
    sort: params.sortField
      ? { field: params.sortField, direction: params.sortDirection ?? 'desc' }
      : undefined,
  })
})
