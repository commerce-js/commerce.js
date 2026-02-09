import { defineEventHandler, getRouterParam } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const productId = getRouterParam(event, 'productId')!

  return adapter.getReviewSummary(productId)
})
