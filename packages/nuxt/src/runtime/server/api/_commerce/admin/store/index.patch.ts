// Admin: Update store settings

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const body = await readBody(event)
  return admin.updateStoreSettings(body)
})
