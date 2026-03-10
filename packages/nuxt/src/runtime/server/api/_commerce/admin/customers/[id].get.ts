// Admin: Get customer by ID

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const id = event.context.params?.id
  if (!id) throw new Error('Customer ID is required')
  return admin.getCustomer(id)
})
