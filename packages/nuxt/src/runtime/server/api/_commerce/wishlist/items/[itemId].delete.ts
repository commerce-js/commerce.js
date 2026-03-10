import { defineCommerceHandler } from '@commercejs/nuxt/runtime/server/utils/handler.js'
import { getRouterParam } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const itemId = getRouterParam(event, 'itemId')!
  return adapter.removeFromWishlist(itemId)
})
