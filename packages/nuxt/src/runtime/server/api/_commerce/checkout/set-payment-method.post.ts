import { defineCommerceHandler } from '../../utils/handler'
import { readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const { cartId, methodId } = setPaymentMethodSchema.parse(await readBody(event))
  return adapter.setPaymentMethod(cartId, methodId)
})
