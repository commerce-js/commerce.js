import { defineEventHandler, getQuery } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
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
