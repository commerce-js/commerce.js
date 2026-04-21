// ---------------------------------------------------------------------------
// POST /api/admin/invite/:token/accept — consume a staff invite (pre-auth)
// ---------------------------------------------------------------------------
//
// PUBLIC — no session required. The storefront posts the new password
// here. Platform's acceptStaffInvite flips admin_users.status to 'active',
// stores a bcrypt-hashed password, and marks the invite used. We then
// issue a merchant session cookie so the invitee lands inside /admin
// without a second login.
//
// Error hygiene: any failure from the platform (expired, used, wrong token,
// short password) returns a 400 with the platform's message. Audit row
// fires on success only.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { parseOrThrow } from '../../../../utils/admin-validate'
import { acceptInviteSchema } from '../../../../utils/admin-schemas'
import { setMerchantSession } from '../../../../utils/merchant-session'
import { recordActivity } from '../../../../utils/audit'

export default defineEventHandler(async (event) => {
  const admin = event.context.admin
  const merchant = event.context.merchant
  if (!admin || !merchant) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Invite token is required' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(acceptInviteSchema, body)

  let user
  try {
    user = await admin.auth.acceptStaffInvite(token, input.password)
  }
  catch (err: any) {
    const msg = err?.message ?? 'Could not accept invite'
    throw createError({ statusCode: 400, statusMessage: 'Bad request', message: msg })
  }

  await setMerchantSession(event, {
    userId: user.id,
    merchantId: merchant.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role,
  })

  await recordActivity(event, 'staff.invite_accepted', 'staff', user.id, {
    email: user.email,
    role: user.role,
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
})
