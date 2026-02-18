// Admin: List orders
import { defineEventHandler, getQuery } from 'h3'
import { useAdminAPI } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const query = getQuery(event) as Record<string, string>

  return admin.listOrders({
    page: query.page ? Number(query.page) : 1,
    perPage: query.perPage ? Number(query.perPage) : 20,
    status: query.status || undefined,
    customerId: query.customerId || undefined,
    dateFrom: query.dateFrom || undefined,
    dateTo: query.dateTo || undefined,
    search: query.search || undefined,
  })
})
