// ---------------------------------------------------------------------------
// PATCH /api/admin/products/:id — update a product
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { updateProductSchema } from '../../../utils/admin-schemas'
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
  const input = parseOrThrow(updateProductSchema, body)

  const product = await admin.updateProduct(id, input)
  await recordActivity(event, 'product.updated', 'product', id, { changedKeys: Object.keys(input) })
  return product
})
