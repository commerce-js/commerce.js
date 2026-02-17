import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Checkout'],
    description: 'Set the billing address for a cart',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const { cartId, address } = setBillingAddressSchema.parse(await readBody(event))
  return adapter.setBillingAddress(cartId, address)
})
