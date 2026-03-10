// Admin: Get store settings

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  return admin.getStoreSettings()
})
