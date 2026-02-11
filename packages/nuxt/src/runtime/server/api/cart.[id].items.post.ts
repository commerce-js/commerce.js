import { defineEventHandler, getRouterParam, readBody } from 'h3'
import type { AddToCartInput } from '@commercejs/types'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<AddToCartInput>(event)

  return adapter.addToCart(id, body)
})
