// ---------------------------------------------------------------------------
// Server middleware — gates all admin routes with session authentication
// ---------------------------------------------------------------------------
// Intercepts requests to /api/_commerce/admin/** and requires a valid
// admin session. The login endpoint is excluded so users can authenticate.

import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const path = event.path || ''

  // Only gate admin routes
  if (!path.startsWith('/api/_commerce/admin')) return

  // Allow the login endpoint through (otherwise you can't authenticate)
  if (path.startsWith('/api/_commerce/admin/auth/login')) return

  // Require a valid session
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required. Please log in via POST /api/_commerce/admin/auth/login.',
    })
  }

  // Verify admin role
  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden. Admin access required.',
    })
  }
})
