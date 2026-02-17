import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Checkout'],
    description: 'Set the shipping address for a cart',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const { cartId, address } = setShippingAddressSchema.parse(await readBody(event))
  return adapter.setShippingAddress(cartId, address)
})
