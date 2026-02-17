import { getRouterParam, readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Cart'],
    description: 'Update cart item quantity',
    parameters: [
      { in: 'path', name: 'id', required: true, description: 'Cart ID' },
      { in: 'path', name: 'itemId', required: true, description: 'Cart item ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const id = getRouterParam(event, 'id')!
  const itemId = getRouterParam(event, 'itemId')!
  const { quantity } = updateCartItemSchema.parse(await readBody(event))
  return adapter.updateCartItem(id, itemId, quantity)
})
