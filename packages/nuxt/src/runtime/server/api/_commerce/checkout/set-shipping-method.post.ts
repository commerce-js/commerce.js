import { defineCommerceHandler } from '#imports'
import { readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const { cartId, methodId } = setShippingMethodSchema.parse(await readBody(event))
  return adapter.setShippingMethod(cartId, methodId)
})
