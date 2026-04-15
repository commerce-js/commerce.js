// POST /api/storefront/checkout/complete — finalize the order
//
// Places the order through the adapter and clears the cart ID from the
// buyer session (customer stays logged in). Returns the created order.
import { defineStorefrontHandler } from '../../../utils/storefrontHandler'
import { getBuyerSession, updateBuyerSession } from '../../../utils/buyerSession'

export default defineStorefrontHandler(async (event, { adapter }) => {
  const session = await getBuyerSession(event)
  if (!session.cartId) {
    throw createError({ statusCode: 404, message: 'No active cart' })
  }

  const order = await adapter.placeOrder(session.cartId)
  // Clear cart ID but keep customerId if present
  await updateBuyerSession(event, { cartId: undefined })
  return order
})
