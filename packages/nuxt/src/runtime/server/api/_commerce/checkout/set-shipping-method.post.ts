import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Checkout'],
    description: 'Set the shipping method for a cart',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const { cartId, methodId } = setShippingMethodSchema.parse(await readBody(event))
  return adapter.setShippingMethod(cartId, methodId)
})
