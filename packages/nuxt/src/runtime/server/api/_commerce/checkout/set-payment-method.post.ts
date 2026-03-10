
export default defineCommerceHandler(async (event, adapter) => {
  const { cartId, methodId } = setPaymentMethodSchema.parse(await readBody(event))
  return adapter.setPaymentMethod(cartId, methodId)
})
