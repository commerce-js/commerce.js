// Admin: Fulfill order
import { defineEventHandler, readBody } from 'h3'
import { useAdminAPI } from '../../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const id = event.context.params?.id
  if (!id) throw new Error('Order ID is required')
  const body = await readBody(event)
  await admin.fulfillOrder(id, body || {})
  return { success: true }
})
