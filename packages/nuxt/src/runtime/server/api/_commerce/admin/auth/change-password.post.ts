// Admin Auth: Change Password
import { defineEventHandler, readBody, createError } from 'h3'
import { useAdminAPI } from '../../../../utils/admin'

defineRouteMeta({
  openAPI: {
    tags: ['Admin Auth'],
    description: 'Change the current admin user\'s password',
  },
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Authentication required.' })
  }

  const { currentPassword, newPassword } = await readBody(event)

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, message: 'Current password and new password are required.' })
  }

  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'New password must be at least 8 characters.' })
  }

  try {
    const admin = useAdminAPI(event)
    await admin.auth.changePassword(session.user.id, currentPassword, newPassword)
    return { success: true }
  } catch (err: any) {
    throw createError({ statusCode: 400, message: err.message || 'Failed to change password.' })
  }
})
