// ---------------------------------------------------------------------------
// POST /api/admin/products — create a product
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { createProductSchema } from '../../../utils/admin-schemas'
import { recordActivity } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(createProductSchema, body)

  const product = await admin.createProduct(input)
  await recordActivity(event, 'product.created', 'product', product.id, { name: input.name })
  return product
})
