import { defineEventHandler, getRouterParam } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const returnId = getRouterParam(event, 'returnId')!

  return adapter.cancelReturn(returnId)
})
