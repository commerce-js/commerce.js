import { getRouterParam } from 'h3'


export default defineCommerceHandler(async (event, adapter) => {
  const id = getRouterParam(event, 'id')!
  const itemId = getRouterParam(event, 'itemId')!
  return adapter.removeFromCart(id, itemId)
})
