
export default defineCommerceHandler(async (event, adapter) => {
  const cartId = getRouterParam(event, 'cartId')!
  return adapter.getPaymentMethods(cartId)
})
