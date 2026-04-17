// ---------------------------------------------------------------------------
// Merchant auth guard — gates /api/admin/* routes
// ---------------------------------------------------------------------------
//
// Called as the first line of every /api/admin/* handler (except the auth
// routes themselves). Enforces two things:
//
//   1. A valid merchant session cookie is present.
//   2. The session's merchantId matches the currently resolved tenant's id.
//      Without this check, an attacker with a valid session on merchant A
//      could replay the cookie against merchant B's host and operate on B's
//      DB (the tenant middleware having happily resolved B from the host).
//
// The tenant middleware runs before us, so event.context.merchant is
// populated. If it's not, we throw 500 — that's a programming error, not
// user-input territory.
// ---------------------------------------------------------------------------

import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getMerchantSession, type MerchantSession } from './merchant-session'

export async function requireMerchantSession(event: H3Event): Promise<MerchantSession> {
  const session = await getMerchantSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const merchant = event.context.merchant
  if (!merchant) {
    // Should not happen — tenant middleware runs before any /api/admin/*
    // handler now that '/api/admin' is out of its skip list. Defensive.
    throw createError({ statusCode: 500, statusMessage: 'Tenant context missing' })
  }

  if (session.merchantId !== merchant.id) {
    // Cross-tenant session replay attempt
    throw createError({ statusCode: 403, statusMessage: 'Session / tenant mismatch' })
  }

  return session
}
