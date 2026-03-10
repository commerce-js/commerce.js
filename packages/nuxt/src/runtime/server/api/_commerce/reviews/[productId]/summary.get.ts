import { defineCommerceHandler } from '../../../utils/handler'
import { getRouterParam } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const productId = getRouterParam(event, 'productId')!
  return adapter.getReviewSummary(productId)
})
