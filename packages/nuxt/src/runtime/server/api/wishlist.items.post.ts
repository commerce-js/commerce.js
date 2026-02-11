import { defineEventHandler, readBody } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const { productId, variantId } = await readBody(event)

  return adapter.addToWishlist(productId, variantId)
})
