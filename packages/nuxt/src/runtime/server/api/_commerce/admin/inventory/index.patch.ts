// Admin: Update inventory

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const body = await readBody(event)
  await admin.updateInventory(body)
  return { success: true }
})
