import { getQuery } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Returns'],
    description: 'List return requests for the current customer',
    parameters: [
      { in: 'query', name: 'page', description: 'Page number' },
      { in: 'query', name: 'perPage', description: 'Items per page' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const query = getQuery(event)
  return adapter.getReturns({
    page: query.page ? Number(query.page) : undefined,
    perPage: query.perPage ? Number(query.perPage) : undefined,
  })
})
