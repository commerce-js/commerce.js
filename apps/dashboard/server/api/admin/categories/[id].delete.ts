// ---------------------------------------------------------------------------
// DELETE /api/admin/categories/:id — delete a category. Platform rejects
// deletes when the category has children (and may extend to products with
// categories attached); surface its 4xx message so the UI toast can quote it.
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
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

  try {
    await admin.deleteCategory(id)
    await recordActivity(event, 'category.deleted', 'category', id)
    return { ok: true }
  }
  catch (err: any) {
    const msg = err?.message || 'Could not delete category'
    if (/not found/i.test(msg)) {
      throw createError({ statusCode: 404, statusMessage: msg })
    }
    // Orphan-prevention, attached-products, or any other platform reason.
    throw createError({ statusCode: 400, statusMessage: msg })
  }
})
