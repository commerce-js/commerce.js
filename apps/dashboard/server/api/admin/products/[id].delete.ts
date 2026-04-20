// ---------------------------------------------------------------------------
// DELETE /api/admin/products/:id — delete a product
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

  await admin.deleteProduct(id)
  await recordActivity(event, 'product.deleted', 'product', id)
  return { ok: true }
})
