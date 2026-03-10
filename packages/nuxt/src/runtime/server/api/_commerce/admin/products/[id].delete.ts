// Admin: Delete product
import { defineEventHandler } from 'h3'
import { useAdminAPI } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const id = event.context.params?.id
  if (!id) throw new Error('Product ID is required')
  await admin.deleteProduct(id)
  return { success: true }
})
