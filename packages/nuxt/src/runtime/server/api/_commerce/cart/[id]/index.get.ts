import { defineCommerceHandler } from '#imports'
import { getRouterParam } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const id = getRouterParam(event, 'id')!
  return adapter.getCart(id)
})
