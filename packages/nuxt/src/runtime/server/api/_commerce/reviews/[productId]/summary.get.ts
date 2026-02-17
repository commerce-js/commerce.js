import { getRouterParam } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Reviews'],
    description: 'Get review summary (average rating, count) for a product',
    parameters: [
      { in: 'path', name: 'productId', required: true, description: 'Product ID' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const productId = getRouterParam(event, 'productId')!
  return adapter.getReviewSummary(productId)
})
