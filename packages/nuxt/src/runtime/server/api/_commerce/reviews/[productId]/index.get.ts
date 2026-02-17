import { getRouterParam, getQuery } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Reviews'],
    description: 'List reviews for a product',
    parameters: [
      { in: 'path', name: 'productId', required: true, description: 'Product ID' },
      { in: 'query', name: 'page', description: 'Page number' },
      { in: 'query', name: 'perPage', description: 'Items per page' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const productId = getRouterParam(event, 'productId')!
  const query = getQuery(event)
  return adapter.getProductReviews(productId, {
    page: query.page ? Number(query.page) : undefined,
    perPage: query.perPage ? Number(query.perPage) : undefined,
  })
})
