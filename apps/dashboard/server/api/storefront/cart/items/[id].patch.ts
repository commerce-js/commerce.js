// PATCH /api/storefront/cart/items/:id — change an item's quantity
//
// Body: { quantity: number }. 404 if the buyer has no cart yet.
import { defineStorefrontHandler } from '../../../../utils/storefrontHandler'
import { getBuyerSession } from '../../../../utils/buyerSession'

export default defineStorefrontHandler(async (event, { adapter }) => {
  const itemId = getRouterParam(event, 'id')!
  const body = await readBody<{ quantity?: number }>(event)

  if (!body || !Number.isFinite(body.quantity) || (body.quantity as number) <= 0) {
    throw createError({ statusCode: 400, message: 'quantity must be a positive integer' })
  }

  const session = await getBuyerSession(event)
  if (!session.cartId) {
    throw createError({ statusCode: 404, message: 'No active cart' })
  }

  return adapter.updateCartItem(session.cartId, itemId, Math.floor(body.quantity as number))
})
