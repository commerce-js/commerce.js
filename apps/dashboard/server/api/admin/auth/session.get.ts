// ---------------------------------------------------------------------------
// GET /api/admin/auth/session — current merchant user, or null
// ---------------------------------------------------------------------------
//
// Returns { id, email, name, role } for the authenticated merchant staff
// member, or null if not signed in. Admin UI route guards call this on
// page load to decide whether to redirect to /admin/login.
//
// Also verifies the session's merchantId matches the resolved tenant. If
// a cookie from host A is somehow presented on host B, we treat it as
// no session — the admin UI will show the login screen, which is the
// right UX (the user picks up their real session on the right host).
// ---------------------------------------------------------------------------

import { defineEventHandler } from 'h3'
import { getMerchantSession } from '../../../utils/merchant-session'

export default defineEventHandler(async (event) => {
  const session = await getMerchantSession(event)
  if (!session) return null

  const merchant = event.context.merchant
  if (!merchant || session.merchantId !== merchant.id) {
    // Cookie from a different tenant's session — treat as unauthenticated.
    return null
  }

  return {
    id: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
  }
})
