// ---------------------------------------------------------------------------
// POST /api/storefront/auth/reset/:token/complete — consume a buyer reset
// ---------------------------------------------------------------------------
//
// On success the adapter's customers domain sets currentCustomerId and we
// mirror that onto the buyer session cookie so the shopper is signed in.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { parseOrThrow } from '../../../../../utils/admin-validate'
import { completePasswordResetSchema } from '../../../../../utils/admin-schemas'
import { getBuyerSession, setBuyerSession } from '../../../../../utils/buyerSession'

export default defineEventHandler(async (event) => {
  const adapter = event.context.adapter as any
  if (!adapter) {
    throw createError({ statusCode: 500, statusMessage: 'Storefront context missing' })
  }

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Reset token is required' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(completePasswordResetSchema, body)

  let customer
  try {
    customer = await adapter.completePasswordReset(token, input.password)
  }
  catch (err: any) {
    const msg = err?.message ?? 'Could not reset password'
    throw createError({ statusCode: 400, statusMessage: 'Bad request', message: msg })
  }

  const existing = await getBuyerSession(event)
  await setBuyerSession(event, { customerId: customer.id, cartId: existing.cartId })

  return customer
})
