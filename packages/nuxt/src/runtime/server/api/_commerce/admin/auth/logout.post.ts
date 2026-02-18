// Admin Auth: Logout
import { defineEventHandler } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['Admin Auth'],
    description: 'Log out the current admin user',
  },
})

export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { success: true }
})
