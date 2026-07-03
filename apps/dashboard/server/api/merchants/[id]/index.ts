// ---------------------------------------------------------------------------
// GET    /api/merchants/:id — fetch one merchant
// PATCH  /api/merchants/:id — partial update
// DELETE /api/merchants/:id — suspend (default) or ?hard=true to also tear
//        down the merchant's Neon project and remove the row
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam, getQuery, createError } from 'h3'
import { useDB } from '../../../utils/db'
import { requireDashboardUser } from '../../../utils/session'
import { deleteMerchantProject } from '../../../utils/neon'
import { invalidateMerchantCache } from '../../../utils/tenant'
import { PUBLIC_MERCHANT_SELECT, toPublicMerchant } from '../../../utils/merchantView'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  if (event.method === 'GET') {
    await requireDashboardUser(event)
    const merchant = await db.merchant.findUnique({
      where: { id },
      select: {
        // Safe fields only — never databaseUrl or passwordHash.
        ...PUBLIC_MERCHANT_SELECT,
        domains: true,
        // Never expose keyHash — the prefix is all the UI needs.
        apiKeys: {
          select: { id: true, name: true, keyPrefix: true, lastUsed: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!merchant) {
      throw createError({ statusCode: 404, message: 'Merchant not found' })
    }
    return merchant
  }

  // Everything below mutates — admin only.
  await requireDashboardUser(event, ['admin'])

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
      const merchant = await db.merchant.update({
        where: { id },
        data: {
          ...body,
          trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : body.trialEndsAt,
        },
      })
      invalidateMerchantCache(id)
      return toPublicMerchant(merchant)
    }
    catch (error: any) {
      if (error?.code === 'P2025') {
        throw createError({ statusCode: 404, message: 'Merchant not found' })
      }
      throw error
    }
  }

  if (event.method === 'DELETE') {
    const merchant = await db.merchant.findUnique({ where: { id } })
    if (!merchant) {
      throw createError({ statusCode: 404, message: 'Merchant not found' })
    }

    const hard = getQuery(event).hard === 'true'

    if (!hard) {
      // Default: suspend. Data (and the Neon project) survives until the
      // operator confirms a hard delete.
      await db.merchant.update({ where: { id }, data: { status: 'suspended' } })
      invalidateMerchantCache(id)
      return { deleted: false, suspended: true }
    }

    // Hard delete: tear down the Neon project FIRST — if that fails we keep
    // the row so the infra handle isn't orphaned (the pre-fix behavior leaked
    // one Neon project per deleted merchant).
    if (merchant.neonProjectId) {
      try {
        await deleteMerchantProject(merchant.neonProjectId)
      }
      catch (error) {
        throw createError({
          statusCode: 502,
          message: `Neon project ${merchant.neonProjectId} could not be deleted — merchant retained. `
            + `Retry, or remove the project in the Neon console first. (${(error as Error).message.slice(0, 200)})`,
        })
      }
    }

    await db.merchant.delete({ where: { id } })
    invalidateMerchantCache(id)
    return { deleted: true, neonProjectDeleted: !!merchant.neonProjectId }
  }
})
