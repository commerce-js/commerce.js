import { defineEventHandler, readBody } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const { email } = await readBody(event)

  await adapter.forgotPassword(email)
  return { success: true }
})
