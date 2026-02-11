import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const id = getRouterParam(event, 'id')!
  const itemId = getRouterParam(event, 'itemId')!
  const body = await readBody<{ quantity: number }>(event)

  return adapter.updateCartItem(id, itemId, body.quantity)
})
