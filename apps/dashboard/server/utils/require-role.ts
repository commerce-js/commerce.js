// ---------------------------------------------------------------------------
// Role gate — lifts `requireMerchantSession` to a role-checked guard
// ---------------------------------------------------------------------------
//
// Used by T09 staff-management write routes (anything that mutates the
// admin_users table). Only the `'owner'` role can add / remove / promote /
// demote other staff — admins and editors get a 403. Read routes stay on
// plain `requireMerchantSession` so admins and editors can still browse
// the staff list from their own /admin/staff page.
// ---------------------------------------------------------------------------

import type { H3Event } from 'h3'
import { createError } from 'h3'
import { requireMerchantSession } from './merchant-auth'
import type { MerchantSession } from './merchant-session'

type StaffRole = MerchantSession['role']

export async function requireRole(event: H3Event, allowed: StaffRole[]): Promise<MerchantSession> {
  const session = await requireMerchantSession(event)
  if (!allowed.includes(session.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: `This action requires one of: ${allowed.join(', ')}`,
    })
  }
  return session
}

export async function requireOwner(event: H3Event): Promise<MerchantSession> {
  return requireRole(event, ['owner'])
}
