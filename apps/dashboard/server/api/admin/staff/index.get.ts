// ---------------------------------------------------------------------------
// GET /api/admin/staff — list staff users on the current merchant branch
// ---------------------------------------------------------------------------
//
// Read is open to any authenticated staff member (owner / admin / editor) so
// editors can still see the team directory. Writes in sibling routes are
// owner-only — see require-role.ts.
// ---------------------------------------------------------------------------

import { defineEventHandler, createError } from 'h3'
import { requireMerchantSession } from '../../../utils/merchant-auth'

export default defineEventHandler(async (event) => {
  await requireMerchantSession(event)

  const admin = event.context.admin
  if (!admin) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  return admin.auth.listAdmins()
})
