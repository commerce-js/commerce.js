import { getRouterParam } from 'h3'


export default defineCommerceHandler(async (event, adapter) => {
  const orderId = getRouterParam(event, 'orderId')!
  return adapter.getOrder(orderId)
})
