import { defineEventHandler, readBody } from 'h3'
import type { RegisterInput } from '@commercejs/types'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const body = await readBody<RegisterInput>(event)

  return adapter.register(body)
})
