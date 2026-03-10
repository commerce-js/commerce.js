import { defineCommerceHandler } from '@commercejs/nuxt/runtime/server/utils/handler'
import { getRouterParam } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const cartId = getRouterParam(event, 'cartId')!
  return adapter.getShippingMethods(cartId)
})
