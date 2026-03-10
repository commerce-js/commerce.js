import { defineCommerceHandler } from '../../utils/handler'
import { readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const { cartId, address } = setBillingAddressSchema.parse(await readBody(event))
  return adapter.setBillingAddress(cartId, address)
})
