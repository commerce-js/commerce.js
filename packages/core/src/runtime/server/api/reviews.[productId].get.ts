import { defineEventHandler, getRouterParam, getQuery } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const productId = getRouterParam(event, 'productId')!
  const { page, perPage } = getQuery(event)

  return adapter.getProductReviews(productId, {
    page: page ? Number(page) : undefined,
    perPage: perPage ? Number(perPage) : undefined,
  })
})
