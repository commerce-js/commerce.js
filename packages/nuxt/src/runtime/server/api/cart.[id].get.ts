import { defineEventHandler, getRouterParam } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const id = getRouterParam(event, 'id')!

  return adapter.getCart(id)
})
