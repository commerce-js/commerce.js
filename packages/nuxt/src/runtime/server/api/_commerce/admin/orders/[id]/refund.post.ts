// Admin: Refund order

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const id = event.context.params?.id
  if (!id) throw new Error('Order ID is required')
  const body = await readBody(event) ?? {}
  await admin.refundOrder(id, body.note)
  return { success: true }
})
