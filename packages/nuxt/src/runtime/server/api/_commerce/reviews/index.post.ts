import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Reviews'],
    description: 'Submit a product review',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const body = submitReviewSchema.parse(await readBody(event))
  return adapter.submitReview(body)
})
