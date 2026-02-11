import { defineEventHandler, getRouterParam } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const id = getRouterParam(event, 'id')!
  const itemId = getRouterParam(event, 'itemId')!

  return adapter.removeFromCart(id, itemId)
})
