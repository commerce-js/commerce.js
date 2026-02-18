// Admin: Update inventory
import { defineEventHandler, readBody } from 'h3'
import { useAdminAPI } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const body = await readBody(event)
  await admin.updateInventory(body)
  return { success: true }
})
