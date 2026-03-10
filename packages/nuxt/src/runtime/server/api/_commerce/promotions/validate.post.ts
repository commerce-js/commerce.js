
export default defineCommerceHandler(async (event, adapter) => {
  const { code } = validateCouponSchema.parse(await readBody(event))
  return adapter.validateCoupon(code)
})
