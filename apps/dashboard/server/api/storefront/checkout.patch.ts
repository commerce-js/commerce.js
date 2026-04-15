// PATCH /api/storefront/checkout — select shipping and/or payment method
//
// Body: { shippingMethodId?, paymentMethodId? }. Either may be supplied
// alone to let the client update selections independently.
import { defineStorefrontHandler } from '../../utils/storefrontHandler'
import { getBuyerSession } from '../../utils/buyerSession'

export default defineStorefrontHandler(async (event, { adapter }) => {
  const body = await readBody<{ shippingMethodId?: string, paymentMethodId?: string }>(event)

  if (!body?.shippingMethodId && !body?.paymentMethodId) {
    throw createError({ statusCode: 400, message: 'shippingMethodId or paymentMethodId is required' })
  }

  const session = await getBuyerSession(event)
  if (!session.cartId) {
    throw createError({ statusCode: 404, message: 'No active cart' })
  }

  let cart
  if (body.shippingMethodId) {
    cart = await adapter.setShippingMethod(session.cartId, body.shippingMethodId)
  }
  if (body.paymentMethodId) {
    cart = await adapter.setPaymentMethod(session.cartId, body.paymentMethodId)
  }
  return cart
})
