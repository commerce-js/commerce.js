import { defineEventHandler, readBody } from 'h3'
import { useServerAdapter } from '../utils/adapter'

export default defineEventHandler(async (event) => {
  const adapter = useServerAdapter(event)
  const { token, newPassword } = await readBody(event)

  await adapter.resetPassword(token, newPassword)
  return { success: true }
})
