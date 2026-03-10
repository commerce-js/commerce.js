// Admin: Get single product by ID

export default defineEventHandler(async (event) => {
  const admin = useAdminAPI(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({ statusCode: 400, message: 'Product ID is required' })
  }

  try {
    return await admin.getProduct(id)
  } catch (err: any) {
    throw createError({
      statusCode: 404,
      message: err?.message || `Product not found: ${id}`,
    })
  }
})
