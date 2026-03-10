import { defineCommerceHandler } from '../../../utils/handler'
import { getRouterParam } from 'h3'

export default defineCommerceHandler(async (event, adapter) => {
  const addressId = getRouterParam(event, 'addressId')!
  return adapter.deleteAddress(addressId)
})
