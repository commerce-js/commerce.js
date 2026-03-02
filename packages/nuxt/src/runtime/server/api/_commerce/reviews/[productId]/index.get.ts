import { getRouterParam, getQuery } from 'h3'


export default defineCommerceHandler(async (event, adapter) => {
  const productId = getRouterParam(event, 'productId')!
  const query = getQuery(event)
  return adapter.getProductReviews(productId, {
    page: query.page ? Number(query.page) : undefined,
    perPage: query.perPage ? Number(query.perPage) : undefined,
  })
})
