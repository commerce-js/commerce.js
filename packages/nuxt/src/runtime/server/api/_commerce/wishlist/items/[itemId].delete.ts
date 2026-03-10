import { defineCommerceHandler } from '../../../utils/handler'
import { getRouterParam } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const itemId = getRouterParam(event, 'itemId')!
  return adapter.removeFromWishlist(itemId)
})
