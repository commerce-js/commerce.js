// Admin: Create category

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const body = await readBody(event)
  return admin.createCategory(body)
})
