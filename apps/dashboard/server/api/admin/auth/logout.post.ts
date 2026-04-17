// ---------------------------------------------------------------------------
// POST /api/admin/auth/logout — clear merchant session cookie
// ---------------------------------------------------------------------------
//
// No auth guard here — logout is idempotent and safe for anonymous calls.
// Always returns { ok: true } so the client can treat it as fire-and-forget.
// ---------------------------------------------------------------------------

import { defineEventHandler } from 'h3'
import { clearMerchantSession } from '../../../utils/merchant-session'

export default defineEventHandler(async (event) => {
  await clearMerchantSession(event)
  return { ok: true }
})
