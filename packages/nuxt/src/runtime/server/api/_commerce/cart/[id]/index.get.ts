import { getRouterParam } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Cart'],
    description: 'Get cart by ID',
    parameters: [
      { in: 'path', name: 'id', required: true, description: 'Cart ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const id = getRouterParam(event, 'id')!
  return adapter.getCart(id)
})
