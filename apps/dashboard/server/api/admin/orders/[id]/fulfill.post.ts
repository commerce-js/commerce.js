// ---------------------------------------------------------------------------
// POST /api/admin/orders/:id/fulfill — mark an order as fulfilled (shipped)
// ---------------------------------------------------------------------------
//
// Body: { trackingNumber?, trackingUrl?, note? } (all optional — merchant may
// ship without a tracking number). Wraps admin.fulfillOrder which sets the
// order status to 'shipped' (the platform's fulfilled state) and records a
// history entry. Delivery-provider dispatch (Armada/Parcel) is a separate
// flow and intentionally NOT wired here.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { requireMerchantSession } from '../../../../utils/merchant-auth'
import { parseOrThrow } from '../../../../utils/admin-validate'
import { fulfillOrderSchema } from '../../../../utils/admin-schemas'

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
  const input = parseOrThrow(fulfillOrderSchema, body ?? {})

  try {
    await admin.fulfillOrder(id, input)
  }
  catch (err: any) {
    const msg = err?.message ?? 'Could not fulfill order'
    if (/not found/i.test(msg)) {
      throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    }
    throw createError({ statusCode: 400, statusMessage: msg })
  }

  return { ok: true }
})
