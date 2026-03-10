// Admin: Get dashboard stats

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  return admin.getDashboardStats()
})
