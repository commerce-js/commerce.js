// Admin: List customers
import { defineEventHandler, getQuery } from 'h3'
import { useAdminAPI } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const query = getQuery(event) as Record<string, string>

  return admin.listCustomers({
    page: query.page ? Number(query.page) : 1,
    perPage: query.perPage ? Number(query.perPage) : 20,
    search: query.search || undefined,
  })
})
