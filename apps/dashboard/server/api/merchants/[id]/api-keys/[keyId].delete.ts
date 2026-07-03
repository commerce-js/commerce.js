// ---------------------------------------------------------------------------
// DELETE /api/merchants/:id/api-keys/:keyId — revoke an API key
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { useDB } from '../../../../utils/db'
import { requireDashboardUser } from '../../../../utils/session'
import { invalidateMerchantCache } from '../../../../utils/tenant'

export default defineEventHandler(async (event) => {
  await requireDashboardUser(event, ['admin'])
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const keyId = getRouterParam(event, 'keyId')!

  const apiKey = await db.apiKey.findFirst({ where: { id: keyId, merchantId: id } })
  if (!apiKey) {
    throw createError({ statusCode: 404, message: 'API key not found' })
  }

  await db.apiKey.delete({ where: { id: keyId } })
  // API-key resolution (tenant.ts resolveByApiKey) hits the DB on every
  // request, so revocation takes effect immediately. This just clears any
  // cached merchant *config* keyed by id — harmless, kept for consistency.
  invalidateMerchantCache(id)

  return { revoked: true }
})
