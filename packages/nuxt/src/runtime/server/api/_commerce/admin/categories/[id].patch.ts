// Admin: Update category

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const id = event.context.params?.id
  if (!id) throw new Error('Category ID is required')
  const body = await readBody(event)
  return admin.updateCategory(id, body)
})
