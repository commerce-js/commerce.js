// ---------------------------------------------------------------------------
// POST /api/auth/logout — clear session
// ---------------------------------------------------------------------------

import { clearUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { ok: true }
})
