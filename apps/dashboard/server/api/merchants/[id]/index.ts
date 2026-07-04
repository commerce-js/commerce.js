// ---------------------------------------------------------------------------
// GET    /api/merchants/:id — fetch one merchant
// PATCH  /api/merchants/:id — partial update
// DELETE /api/merchants/:id — remove (cascades to api_keys + domains)
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { useDB } from '../../../utils/db'
import { requireDashboardSession } from '../../../utils/authorize'
import { PUBLIC_API_KEY_SELECT } from '../../../utils/apiKeySelect'
import { toPublicMerchant } from '../../../utils/publicMerchant'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  if (event.method === 'GET') {
    await requireDashboardSession(event, 'read')
    const merchant = await db.merchant.findUnique({
      where: { id },
      // Never expose api_keys.keyHash to the client — safe metadata only.
      include: { domains: true, apiKeys: { select: PUBLIC_API_KEY_SELECT, orderBy: { createdAt: 'desc' } } },
    })
    if (!merchant) {
      throw createError({ statusCode: 404, message: 'Merchant not found' })
    }
    return toPublicMerchant(merchant)
  }

  // All mutations to a merchant row are admin-only.
  await requireDashboardSession(event, 'admin')

  if (event.method === 'PATCH') {
    const body = await readBody<Partial<{
      name: string
      email: string
      plan: string
      status: string
      dashboardRole: string
      tapCustomerId: string
      currency: string
      locale: string
      customDomain: string | null
      databaseUrl: string
      neonProjectId: string
      neonBranchId: string
      trialEndsAt: string | null
    }>>(event)

    try {
      const updated = await db.merchant.update({
        where: { id },
        data: {
          ...body,
          trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : body.trialEndsAt,
        },
      })
      return toPublicMerchant(updated)
    }
    catch (error: any) {
      if (error?.code === 'P2025') {
        throw createError({ statusCode: 404, message: 'Merchant not found' })
      }
      throw error
    }
  }

  if (event.method === 'DELETE') {
    try {
      await db.merchant.delete({ where: { id } })
      return { deleted: true }
    }
    catch (error: any) {
      if (error?.code === 'P2025') {
        throw createError({ statusCode: 404, message: 'Merchant not found' })
      }
      throw error
    }
  }
})
