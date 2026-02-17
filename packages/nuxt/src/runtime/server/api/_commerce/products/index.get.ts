import { getQuery } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Catalog'],
    description: 'List products with optional filtering, pagination, and sorting',
    parameters: [
      { in: 'query', name: 'query', description: 'Search query' },
      { in: 'query', name: 'categoryId', description: 'Filter by category ID' },
      { in: 'query', name: 'page', description: 'Page number' },
      { in: 'query', name: 'perPage', description: 'Items per page' },
      { in: 'query', name: 'sortField', description: 'Sort field' },
      { in: 'query', name: 'sortDirection', description: 'Sort direction (asc/desc)' },
    ],
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const query = getQuery(event)
  return adapter.getProducts({
    query: query.query as string | undefined,
    categoryId: query.categoryId as string | undefined,
    page: query.page ? Number(query.page) : undefined,
    perPage: query.perPage ? Number(query.perPage) : undefined,
    sort: query.sortField
      ? { field: query.sortField as string, direction: (query.sortDirection as any) || 'asc' }
      : undefined,
  })
})
