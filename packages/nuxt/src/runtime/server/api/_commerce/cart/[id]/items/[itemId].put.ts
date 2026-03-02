import { defineCommerceHandler } from '../../../../utils/handler'
import { getRouterParam, readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const id = getRouterParam(event, 'id')!
  const itemId = getRouterParam(event, 'itemId')!
  const { quantity } = updateCartItemSchema.parse(await readBody(event))
  return adapter.updateCartItem(id, itemId, quantity)
})
