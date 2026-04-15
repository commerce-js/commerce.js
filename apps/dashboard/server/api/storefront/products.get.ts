// GET /api/storefront/products — paginated product search for the resolved merchant
import { defineStorefrontHandler } from '../../utils/storefrontHandler'

export default defineStorefrontHandler(async (event, { adapter }) => {
  const query = getQuery(event)
  return adapter.getProducts({
    query: query.query as string | undefined,
    categoryId: query.categoryId as string | undefined,
    page: query.page ? Number(query.page) : undefined,
    perPage: query.perPage ? Number(query.perPage) : undefined,
    sort: query.sortField
      ? { field: query.sortField as string, direction: (query.sortDirection as 'asc' | 'desc') || 'asc' }
      : undefined,
  })
})
