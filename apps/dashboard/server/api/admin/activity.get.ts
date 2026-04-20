// ---------------------------------------------------------------------------
// GET /api/admin/activity — paginated + filterable audit log
// ---------------------------------------------------------------------------
//
// Query params: page?, perPage?, actorId?, entityType?, from?, to?
// All staff can read in v1 (no role restriction).
// ---------------------------------------------------------------------------

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireMerchantSession } from '../../utils/merchant-auth'
import { parseOrThrow } from '../../utils/admin-validate'
import { listActivityQuerySchema } from '../../utils/admin-schemas'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const q = parseOrThrow(listActivityQuerySchema, getQuery(event))

  return admin.listActivity(q)
})
