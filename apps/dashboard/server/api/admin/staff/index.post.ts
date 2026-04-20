// ---------------------------------------------------------------------------
// POST /api/admin/staff — create a staff user (owner-only)
// ---------------------------------------------------------------------------
//
// T09 ships local-password-only. The owner sets the password and shares it
// out-of-band with the new user (who then signs in at /admin/login). The
// email-workstream plan replaces this with a token-based invite flow.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError } from 'h3'
import { requireOwner } from '../../../utils/require-role'
import { parseOrThrow } from '../../../utils/admin-validate'
import { createStaffSchema } from '../../../utils/admin-schemas'
import { recordActivity } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  await requireOwner(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(createStaffSchema, body)

  let created
  try {
    created = await admin.auth.createAdmin(input)
  }
  catch (err: any) {
    const msg = err?.message ?? 'Could not create staff user'
    if (/already exists/i.test(msg)) {
      throw createError({ statusCode: 409, statusMessage: 'Conflict', message: msg })
    }
    throw createError({ statusCode: 400, statusMessage: 'Bad request', message: msg })
  }
  await recordActivity(event, 'staff.created', 'staff', created.id, {
    email: created.email,
    role: created.role,
  })
  return created
})
