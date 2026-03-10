import { defineCommerceHandler } from '../../../utils/handler'
import { getRouterParam } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const cartId = getRouterParam(event, 'cartId')!
  return adapter.getPaymentMethods(cartId)
})
