import { defineEventHandler, readBody } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const body = await readBody<{ cartId: string }>(event)

  return adapter.placeOrder(body.cartId)
})
