// Admin: List products
import { defineEventHandler, getQuery } from 'h3'
import { useAdminAPI } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const query = getQuery(event) as Record<string, string>

  return admin.listProducts({
    page: query.page ? Number(query.page) : 1,
    perPage: query.perPage ? Number(query.perPage) : 20,
    search: query.search || undefined,
    sort: query.sortField
      ? { field: query.sortField, direction: (query.sortDir || 'desc') as 'asc' | 'desc' }
      : undefined,
  })
})
