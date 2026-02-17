import { getRouterParam, readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Cart'],
    description: 'Add an item to the cart',
    parameters: [
      { in: 'path', name: 'id', required: true, description: 'Cart ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const id = getRouterParam(event, 'id')!
  const body = addToCartSchema.parse(await readBody(event))
  return adapter.addToCart(id, body)
})
