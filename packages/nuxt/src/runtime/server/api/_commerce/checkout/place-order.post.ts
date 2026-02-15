import { readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const { cartId } = placeOrderSchema.parse(await readBody(event))
  return adapter.placeOrder(cartId)
})
