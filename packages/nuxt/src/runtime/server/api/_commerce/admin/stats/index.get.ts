// Admin: Get dashboard stats
import { defineEventHandler } from 'h3'
import { useAdminAPI } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  return admin.getDashboardStats()
})
