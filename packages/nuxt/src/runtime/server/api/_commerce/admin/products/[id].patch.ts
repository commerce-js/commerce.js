// Admin: Update product

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const id = event.context.params?.id
  if (!id) throw new Error('Product ID is required')
  const body = await readBody(event)
  return admin.updateProduct(id, body)
})
