import { getRouterParam } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Checkout'],
    description: 'Get available shipping methods for a cart',
    parameters: [
      { in: 'path', name: 'cartId', required: true, description: 'Cart ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const cartId = getRouterParam(event, 'cartId')!
  return adapter.getShippingMethods(cartId)
})
