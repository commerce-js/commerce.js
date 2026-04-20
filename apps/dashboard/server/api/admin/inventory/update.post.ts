// ---------------------------------------------------------------------------
// POST /api/admin/inventory/update — adjust a product (or variant) quantity
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'
import { parseOrThrow } from '../../../utils/admin-validate'
import { updateInventorySchema } from '../../../utils/admin-schemas'
import { recordActivity } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(updateInventorySchema, body)

  await admin.updateInventory(input)
  await recordActivity(event, 'inventory.updated', 'product', input.productId, {
    variantId: input.variantId ?? null,
    adjustment: input.adjustment ?? 'set',
    quantity: input.quantity,
  })
  return { ok: true }
})
