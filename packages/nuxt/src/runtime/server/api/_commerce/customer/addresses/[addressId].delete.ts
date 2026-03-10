
export default defineCommerceHandler(async (event, adapter) => {
  const addressId = getRouterParam(event, 'addressId')!
  return adapter.deleteAddress(addressId)
})
