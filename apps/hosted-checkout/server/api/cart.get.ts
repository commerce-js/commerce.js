// ---------------------------------------------------------------------------
// GET /api/cart?id=<cartId> — Load cart from shared Neon DB
// ---------------------------------------------------------------------------

import { createCartDomain } from '@commercejs/platform'
import { ensureDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const cartId = query.id as string

  if (!cartId) {
    throw createError({ statusCode: 400, message: 'Cart ID is required' })
  }

  ensureDb()
  const config = useRuntimeConfig()
  const currency = config.commerceCurrency || 'BHD'
  const cartDomain = createCartDomain(currency)

  try {
    const cart = await cartDomain.getCart(cartId)
    return cart
  }
  catch {
    throw createError({ statusCode: 404, message: 'Cart not found' })
  }
})
