import { defineCommerceHandler } from '../../../utils/handler'
import { getRouterParam, readBody } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const addressId = getRouterParam(event, 'addressId')!
  const body = updateAddressSchema.parse(await readBody(event))
  return adapter.updateAddress(addressId, body)
})
