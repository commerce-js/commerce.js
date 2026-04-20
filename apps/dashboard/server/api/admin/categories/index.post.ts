// ---------------------------------------------------------------------------
// POST /api/admin/categories — create a category
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { createCategorySchema } from '../../../utils/admin-schemas'
import { recordActivity } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(createCategorySchema, body)

  const category = await admin.createCategory(input)
  await recordActivity(event, 'category.created', 'category', category.id, { name: input.name })
  return category
})
