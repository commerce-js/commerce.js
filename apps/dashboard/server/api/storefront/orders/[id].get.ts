// GET /api/storefront/orders/:id — a single order owned by the signed-in buyer
//
// 401 if no session; 404 if the order exists but belongs to a different
// customer (we never reveal other tenants' or other buyers' orders).
import { defineStorefrontHandler } from '../../../utils/storefrontHandler'
import { requireBuyer } from '../../../utils/buyerSession'

export default defineStorefrontHandler(async (event, { admin }) => {
  const { customerId } = await requireBuyer(event)
  const orderId = getRouterParam(event, 'id')!

  const order = await admin.getOrder(orderId)
  if (order.customerId !== customerId) {
    throw createError({ statusCode: 404, message: 'Order not found' })
  }
  return order
})
