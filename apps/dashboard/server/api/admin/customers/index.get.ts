// ---------------------------------------------------------------------------
// GET /api/admin/customers — paginated list with search
// ---------------------------------------------------------------------------

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { listCustomersQuerySchema } from '../../../utils/admin-schemas'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const params = parseOrThrow(listCustomersQuerySchema, getQuery(event))

  return admin.listCustomers({
    page: params.page,
    perPage: params.perPage,
    search: params.search,
    sort: params.sortField
      ? { field: params.sortField, direction: params.sortDirection ?? 'desc' }
      : undefined,
  })
})
