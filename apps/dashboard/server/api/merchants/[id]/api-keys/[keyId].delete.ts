// ---------------------------------------------------------------------------
// DELETE /api/merchants/:id/api-keys/:keyId — revoke an API key
// ---------------------------------------------------------------------------
// Scoped to (keyId AND merchantId) via deleteMany so an operator can't revoke
// a key belonging to a different merchant by guessing its id. Admin only.
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { useDB } from '../../../../utils/db'
import { requireDashboardSession } from '../../../../utils/authorize'

export default defineEventHandler(async (event) => {
  await requireDashboardSession(event, 'admin')

  const merchantId = getRouterParam(event, 'id')!
  const keyId = getRouterParam(event, 'keyId')!

  const { count } = await useDB().apiKey.deleteMany({
    where: { id: keyId, merchantId },
  })
  if (count === 0) {
    throw createError({ statusCode: 404, message: 'API key not found' })
  }

  return { revoked: true, id: keyId }
})
