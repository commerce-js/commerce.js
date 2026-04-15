// DELETE /api/storefront/cart/items/:id — remove an item from the buyer's cart
import { defineStorefrontHandler } from '../../../../utils/storefrontHandler'
import { getBuyerSession } from '../../../../utils/buyerSession'

export default defineStorefrontHandler(async (event, { adapter }) => {
  const itemId = getRouterParam(event, 'id')!

  const session = await getBuyerSession(event)
  if (!session.cartId) {
    throw createError({ statusCode: 404, message: 'No active cart' })
  }

  return adapter.removeFromCart(session.cartId, itemId)
})
