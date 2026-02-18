// Admin: Update category
import { defineEventHandler, readBody } from 'h3'
import { useAdminAPI } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const id = event.context.params?.id
  if (!id) throw new Error('Category ID is required')
  const body = await readBody(event)
  return admin.updateCategory(id, body)
})
