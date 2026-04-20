// ---------------------------------------------------------------------------
// POST /api/admin/orders/:id/refund — mark an order as refunded
// ---------------------------------------------------------------------------
//
// Body: { note? }. Platform API takes a note only (no amount) — partial
// refunds would need a platform schema + API change. Do not invent that
// here; if merchants ask for partial refunds, flag it separately.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { requireMerchantSession } from '../../../../utils/merchant-auth'
import { parseOrThrow } from '../../../../utils/admin-validate'
import { refundOrderSchema } from '../../../../utils/admin-schemas'
import { recordActivity } from '../../../../utils/audit'

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
  const input = parseOrThrow(refundOrderSchema, body ?? {})

  try {
    await admin.refundOrder(id, input.note)
  }
  catch (err: any) {
    const msg = err?.message ?? 'Could not refund order'
    if (/not found/i.test(msg)) {
      throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    }
    throw createError({ statusCode: 400, statusMessage: msg })
  }

  await recordActivity(event, 'order.refunded', 'order', id, {
    note: input.note ?? null,
  })

  return { ok: true }
})
