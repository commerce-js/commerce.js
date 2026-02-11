import { defineEventHandler, getRouterParam } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const cartId = getRouterParam(event, 'cartId')!

  return adapter.getPaymentMethods(cartId)
})
