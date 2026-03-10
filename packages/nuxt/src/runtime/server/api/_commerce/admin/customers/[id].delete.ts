// Admin: Delete customer
import { defineEventHandler } from 'h3'
import { useAdminAPI } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const id = event.context.params?.id
  if (!id) throw new Error('Customer ID is required')
  await admin.deleteCustomer(id)
  return { success: true }
})
