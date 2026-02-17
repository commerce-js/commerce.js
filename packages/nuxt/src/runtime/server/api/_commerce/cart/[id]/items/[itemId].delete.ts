import { getRouterParam } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Cart'],
    description: 'Remove an item from the cart',
    parameters: [
      { in: 'path', name: 'id', required: true, description: 'Cart ID' },
      { in: 'path', name: 'itemId', required: true, description: 'Cart item ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const id = getRouterParam(event, 'id')!
  const itemId = getRouterParam(event, 'itemId')!
  return adapter.removeFromCart(id, itemId)
})
