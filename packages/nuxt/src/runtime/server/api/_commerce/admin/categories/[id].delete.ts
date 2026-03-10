// Admin: Delete category
import { defineEventHandler } from 'h3'
import { useAdminAPI } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const id = event.context.params?.id
  if (!id) throw new Error('Category ID is required')
  await admin.deleteCategory(id)
  return { success: true }
})
