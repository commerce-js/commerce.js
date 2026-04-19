// ---------------------------------------------------------------------------
// GET /api/admin/categories — flat list (used by product form's category
// multi-select and the /admin/categories list page). Optional ?parentId= to
// scope to children of a specific parent.
// ---------------------------------------------------------------------------

import { defineEventHandler, getQuery, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const { parentId } = getQuery(event)
  return admin.listCategories(typeof parentId === 'string' && parentId ? parentId : undefined)
})
