// ---------------------------------------------------------------------------
// GET /api/admin/invite/:token — validate a staff-invite token (pre-auth)
// ---------------------------------------------------------------------------
//
// PUBLIC — no session required. The storefront's /admin/invite/[token]
// page calls this on mount to decide whether to render the "set password"
// form or an "invite expired / invalid" placeholder.
//
// Returns `{ email, expiresAt }` on success, 404 otherwise. We deliberately
// collapse "missing", "expired", and "used" into a single 404 so an
// attacker probing random tokens can't learn which ones exist.
//
// Rate-limiting is not applied in v1 — callers hit it once per /admin/invite
// page load. A future task can add a per-IP rate limit if probing becomes
// an issue.
// ---------------------------------------------------------------------------

import { defineEventHandler, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 404, statusMessage: 'Invite not found' })
  }

  const result = await admin.auth.verifyStaffInviteToken(token)
  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Invite not found' })
  }

  return {
    email: result.email,
    expiresAt: result.expiresAt.toISOString(),
  }
})
