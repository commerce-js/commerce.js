import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Checkout'],
    description: 'Place an order from a cart',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const { cartId } = placeOrderSchema.parse(await readBody(event))
  return adapter.placeOrder(cartId)
})
