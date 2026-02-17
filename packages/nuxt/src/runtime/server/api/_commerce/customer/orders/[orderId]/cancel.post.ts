import { getRouterParam } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Orders'],
    description: 'Cancel an order',
    parameters: [
      { in: 'path', name: 'orderId', required: true, description: 'Order ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const orderId = getRouterParam(event, 'orderId')!
  return adapter.cancelOrder(orderId)
})
