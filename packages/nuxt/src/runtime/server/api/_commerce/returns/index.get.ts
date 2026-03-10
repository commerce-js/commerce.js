
export default defineCommerceHandler(async (event, adapter) => {
  const query = getQuery(event)
  return adapter.getReturns({
    page: query.page ? Number(query.page) : undefined,
    perPage: query.perPage ? Number(query.perPage) : undefined,
  })
})
