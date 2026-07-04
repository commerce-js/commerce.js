// ---------------------------------------------------------------------------
// Control-plane authorization — who may read vs. mutate the control DB
// ---------------------------------------------------------------------------
//
// Operator-facing routes under /api/merchants act on the singleton control DB
// (merchants, api_keys, domains) and provision real Neon infrastructure. They
// MUST be gated: an unauthenticated caller could list every tenant or create
// merchants (which triggers billable provisioning).
//
// Two operator roles (DashboardUser.role): 'admin' (full control) and
// 'support' (read-oriented). The authorization decision is a pure function so
// it's unit-testable without an h3 event; `requireDashboardSession` is the thin
// route guard around it.
// ---------------------------------------------------------------------------

import { createError } from 'h3'
import type { H3Event } from 'h3'
import type { DashboardSession } from './session'
import { getDashboardSession } from './session'

/** Access level a route requires. `read` = any authenticated operator. */
export type RequiredAccess = 'read' | 'admin'

export type AuthzDecision =
  | { ok: true, session: DashboardSession }
  | { ok: false, status: 401 | 403, message: string }

/**
 * Pure authorization policy. No h3/runtime deps, so it's unit-testable.
 * - No session → 401.
 * - `admin` required but role is not 'admin' → 403.
 * - Otherwise → ok.
 */
export function authorizeDashboardSession(
  session: DashboardSession | null,
  required: RequiredAccess,
): AuthzDecision {
  if (!session) {
    return { ok: false, status: 401, message: 'Authentication required' }
  }
  if (required === 'admin' && session.role !== 'admin') {
    return { ok: false, status: 403, message: 'Admin role required for this action' }
  }
  return { ok: true, session }
}

/**
 * Route guard: resolve the dashboard session, enforce `required`, and either
 * return the session or throw the appropriate h3 error (401/403). Call at the
 * top of every /api/merchants handler before touching the control DB.
 */
export async function requireDashboardSession(
  event: H3Event,
  required: RequiredAccess = 'read',
): Promise<DashboardSession> {
  const session = await getDashboardSession(event)
  const decision = authorizeDashboardSession(session, required)
  if (!decision.ok) {
    throw createError({
      statusCode: decision.status,
      statusMessage: decision.status === 401 ? 'Unauthorized' : 'Forbidden',
      message: decision.message,
    })
  }
  return decision.session
}
