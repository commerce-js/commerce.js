// Admin: Get store settings
import { defineEventHandler } from 'h3'
import { useAdminAPI } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  return admin.getStoreSettings()
})
