// ---------------------------------------------------------------------------
// POST /api/auth/logout — clear the operator session
// ---------------------------------------------------------------------------

import { defineEventHandler } from 'h3'
import { clearDashboardSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  await clearDashboardSession(event)
  return { ok: true }
})
