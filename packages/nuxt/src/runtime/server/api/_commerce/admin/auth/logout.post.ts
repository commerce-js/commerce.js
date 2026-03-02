// Admin Auth: Logout
import { defineEventHandler } from 'h3'


export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { success: true }
})
