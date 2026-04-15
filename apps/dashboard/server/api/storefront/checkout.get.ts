// GET /api/storefront/checkout — checkout summary for the buyer's cart
//
// Returns the cart plus available shipping and payment methods so the
// client can render the whole checkout screen in one round-trip.
import { defineStorefrontHandler } from '../../utils/storefrontHandler'
import { getBuyerSession } from '../../utils/buyerSession'

export default defineStorefrontHandler(async (event, { adapter }) => {
  const session = await getBuyerSession(event)
  if (!session.cartId) {
    throw createError({ statusCode: 404, message: 'No active cart' })
  }

  const [cart, shippingMethods, paymentMethods] = await Promise.all([
    adapter.getCart(session.cartId),
    adapter.getShippingMethods(session.cartId),
    adapter.getPaymentMethods(session.cartId),
  ])

  return { cart, shippingMethods, paymentMethods }
})
