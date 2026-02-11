import { defineEventHandler, readBody } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const body = await readBody<{ email: string; password: string }>(event)

  return adapter.login(body.email, body.password)
})
