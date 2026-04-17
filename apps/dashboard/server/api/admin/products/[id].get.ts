// ---------------------------------------------------------------------------
// GET /api/admin/products/:id — fetch a single product by id
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'

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
    return await admin.getProduct(id)
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }
})
