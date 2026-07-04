// ---------------------------------------------------------------------------
// POST /api/merchants/:id/provision — manually re-trigger provisioning
// ---------------------------------------------------------------------------
//
// Used when the initial `provision-store` job failed past its retry limit
// and the merchant is stuck in `status='provisioning'`. Operator inspects
// the worker logs, fixes whatever was wrong (NEON_API_KEY, region quota,
// transient upstream outage), then hits this endpoint to enqueue a fresh
// job. The job itself is idempotent — it reuses the partial Neon project
// if one was already created, so retrying is safe.
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { useDB } from '../../../utils/db'
import { enqueueMerchantJob } from '../../../utils/queue'
import { requireDashboardSession } from '../../../utils/authorize'

export default defineEventHandler(async (event) => {
  // Re-provisioning enqueues billable Neon work — admin only.
  await requireDashboardSession(event, 'admin')
  const id = getRouterParam(event, 'id')!

  const db = useDB()
  const merchant = await db.merchant.findUnique({ where: { id } })
  if (!merchant) {
    throw createError({ statusCode: 404, message: 'Merchant not found' })
  }

  if (merchant.status === 'active' && merchant.databaseUrl) {
    return {
      enqueued: false,
      reason: 'Merchant is already active with a databaseUrl — nothing to do.',
    }
  }

  await enqueueMerchantJob({
    type: 'provision-store',
    data: { merchantId: id },
  })

  return { enqueued: true, merchantId: id }
})
