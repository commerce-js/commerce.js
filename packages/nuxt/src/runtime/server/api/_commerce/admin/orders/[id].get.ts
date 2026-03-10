// Admin: Get single order
import { defineEventHandler, createError } from 'h3'
import { useAdminAPI } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({ statusCode: 400, message: 'Order ID is required' })
  }

  try {
    return await admin.getOrder(id)
  } catch (err: any) {
    throw createError({
      statusCode: 404,
      message: err?.message || `Order not found: ${id}`,
    })
  }
})
