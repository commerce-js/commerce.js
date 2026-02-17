import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Checkout'],
    description: 'Set the payment method for a cart',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const { cartId, methodId } = setPaymentMethodSchema.parse(await readBody(event))
  return adapter.setPaymentMethod(cartId, methodId)
})
