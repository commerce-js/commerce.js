// GET /api/storefront/cart — fetch (or lazily create) the buyer's cart
//
// The buyer session holds a `cartId`. If it exists we fetch it; if not, or
// if the stored cart can no longer be found (stale cookie after provisioning
// reset), we create a fresh one and persist its ID.
import { defineStorefrontHandler } from '../../utils/storefrontHandler'
import { getBuyerSession, updateBuyerSession } from '../../utils/buyerSession'

export default defineStorefrontHandler(async (event, { adapter }) => {
  const session = await getBuyerSession(event)

  if (session.cartId) {
    try {
      return await adapter.getCart(session.cartId)
    }
    catch {
      // Fall through — stale cart ID, create a new one below.
    }
  }

  const cart = await adapter.createCart()
  await updateBuyerSession(event, { cartId: cart.id })
  return cart
})
