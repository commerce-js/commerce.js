import { readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Promotions'],
    description: 'Validate a coupon or promo code',
  },
})

export default defineCommerceHandler(async (event, adapter) => {
  const { code } = validateCouponSchema.parse(await readBody(event))
  return adapter.validateCoupon(code)
})
