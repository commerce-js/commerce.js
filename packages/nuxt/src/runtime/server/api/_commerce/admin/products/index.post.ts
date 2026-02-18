// Admin: Create product
import { defineEventHandler, readBody } from 'h3'
import { useAdminAPI } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const body = await readBody(event)
  return admin.createProduct(body)
})
