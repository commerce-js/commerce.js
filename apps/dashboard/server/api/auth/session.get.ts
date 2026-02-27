// ---------------------------------------------------------------------------
// GET /api/auth/session — return current session info
// ---------------------------------------------------------------------------

import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session) {
    return { authenticated: false }
  }

  return {
    authenticated: true,
    userId: session.userId,
    githubUsername: session.githubUsername,
  }
})
