import { defineCommerceHandler } from '@commercejs/nuxt/runtime/server/utils/handler'
import { getQuery } from 'h3'

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
