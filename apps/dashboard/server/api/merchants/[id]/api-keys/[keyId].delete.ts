// ---------------------------------------------------------------------------
// DELETE /api/merchants/:id/api-keys/:keyId — revoke an API key
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { useDB } from '../../../../utils/db'
import { requireDashboardUser } from '../../../../utils/session'
import { invalidateMerchantCache } from '../../../../utils/tenant'

export default defineEventHandler(async (event) => {
  await requireDashboardUser(event)
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const keyId = getRouterParam(event, 'keyId')!

  const apiKey = await db.apiKey.findFirst({ where: { id: keyId, merchantId: id } })
  if (!apiKey) {
    throw createError({ statusCode: 404, message: 'API key not found' })
  }

  await db.apiKey.delete({ where: { id: keyId } })
  // The tenant resolver caches merchant lookups keyed by resolved id —
  // drop them so a revoked key stops working within one cache window.
  invalidateMerchantCache(id)

  return { revoked: true }
})
