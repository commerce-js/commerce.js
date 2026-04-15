// ---------------------------------------------------------------------------
// GET /api/auth/session — return the currently signed-in operator, or null
// ---------------------------------------------------------------------------

import { defineEventHandler } from 'h3'
import { getDashboardSession } from '../../utils/session'
import { useDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getDashboardSession(event)

  // Signal whether any operator exists so the login page can switch
  // between "sign in" and "first-run register" UX — safe to expose: it's
  // a boolean, not PII.
  const db = useDB()
  const hasAnyOperator = (await db.dashboardUser.count()) > 0

  if (!session) {
    return { user: null, hasAnyOperator }
  }

  return {
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    },
    hasAnyOperator,
  }
})
