// POST /api/storefront/cart/items — add an item to the buyer's cart
//
// Auto-creates the cart on first interaction so the client never has to
// juggle cart IDs. Body: { productId, variantId?, quantity? }.
import { defineStorefrontHandler } from '../../../utils/storefrontHandler'
import { getBuyerSession, updateBuyerSession } from '../../../utils/buyerSession'

export default defineStorefrontHandler(async (event, { adapter }) => {
  const body = await readBody<{ productId?: string, variantId?: string, quantity?: number }>(event)

  if (!body?.productId) {
    throw createError({ statusCode: 400, message: 'productId is required' })
  }
  const quantity = Number.isFinite(body.quantity) && body.quantity! > 0 ? Math.floor(body.quantity!) : 1

  const session = await getBuyerSession(event)
  let cartId = session.cartId

  if (!cartId) {
    const cart = await adapter.createCart()
    cartId = cart.id
    await updateBuyerSession(event, { cartId })
  }

  try {
    return await adapter.addToCart(cartId, {
      productId: body.productId,
      variantId: body.variantId,
      quantity,
    })
  }
  catch (err) {
    // Stale cart ID → recover by creating a new cart and retrying once.
    const cart = await adapter.createCart()
    await updateBuyerSession(event, { cartId: cart.id })
    return adapter.addToCart(cart.id, {
      productId: body.productId,
      variantId: body.variantId,
      quantity,
    })
  }
})
