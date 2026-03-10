import { defineCommerceHandler } from '@commercejs/nuxt/runtime/server/utils/handler'
import { readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const body = submitReviewSchema.parse(await readBody(event))
  return adapter.submitReview(body)
})
