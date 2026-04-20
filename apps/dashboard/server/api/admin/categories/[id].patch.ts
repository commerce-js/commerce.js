// ---------------------------------------------------------------------------
// PATCH /api/admin/categories/:id — update a category. Platform rejects
// self-parent / descendant-cycle parentId changes; surface its 4xx message
// so the UI toast can quote it. Mirrors the shape of [id].delete.ts.
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

  try {
    const category = await admin.updateCategory(id, input)
    await recordActivity(event, 'category.updated', 'category', id, { changedKeys: Object.keys(input) })
    return category
  }
  catch (err: any) {
    const msg = err?.message || 'Could not update category'
    if (/not found/i.test(msg)) {
      throw createError({ statusCode: 404, statusMessage: msg })
    }
    // Self-parent, descendant-cycle, or any other platform validation reason.
    throw createError({ statusCode: 400, statusMessage: msg })
  }
})
