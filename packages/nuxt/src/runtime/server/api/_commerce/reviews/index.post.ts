
export default defineCommerceHandler(async (event, adapter) => {
  const body = submitReviewSchema.parse(await readBody(event))
  return adapter.submitReview(body)
})
