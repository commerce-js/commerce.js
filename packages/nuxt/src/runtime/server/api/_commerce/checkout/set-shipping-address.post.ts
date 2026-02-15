import { readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const { cartId, address } = setShippingAddressSchema.parse(await readBody(event))
  return adapter.setShippingAddress(cartId, address)
})
