// ---------------------------------------------------------------------------
// PATCH /api/admin/staff/:id — update name / role (owner-only)
// ---------------------------------------------------------------------------
//
// Password changes live at /api/admin/staff/:id/password.patch to keep the
// UI's per-field validation simple. The platform's updateAdmin enforces the
// last-owner guard as a safety net; we mirror the 400 message here.
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireOwner } from '../../../utils/require-role'
import { parseOrThrow } from '../../../utils/admin-validate'
import { updateStaffSchema } from '../../../utils/admin-schemas'
import { recordActivity } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  await requireOwner(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(updateStaffSchema, body)

  let updated
  try {
    updated = await admin.auth.updateAdmin(id, input)
  }
  catch (err: any) {
    const msg = err?.message ?? 'Could not update staff user'
    if (/not found/i.test(msg)) {
      throw createError({ statusCode: 404, statusMessage: 'Not found', message: msg })
    }
    throw createError({ statusCode: 400, statusMessage: 'Bad request', message: msg })
  }
  await recordActivity(event, 'staff.updated', 'staff', id, { changedKeys: Object.keys(input) })
  return updated
})
