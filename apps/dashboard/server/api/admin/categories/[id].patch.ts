// ---------------------------------------------------------------------------
// PATCH /api/admin/categories/:id — update a category
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { updateCategorySchema } from '../../../utils/admin-schemas'
import { recordActivity } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(updateCategorySchema, body)

  const category = await admin.updateCategory(id, input)
  await recordActivity(event, 'category.updated', 'category', id, { changedKeys: Object.keys(input) })
  return category
})
