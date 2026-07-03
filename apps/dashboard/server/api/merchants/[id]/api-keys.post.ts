// ---------------------------------------------------------------------------
// POST /api/merchants/:id/api-keys — mint an API key
//
// Key format matches tenant.ts resolveByApiKey exactly:
//   <prefix>_<secret>   where prefix is the first underscore-token.
// Only the sha256 hash of the FULL key is stored; the plaintext is returned
// once. Storefronts send it as `X-Commerce-Key`.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { useDB } from '../../../utils/db'
import { requireDashboardUser } from '../../../utils/session'
import { generateApiKey } from '../../../utils/apiKey'
import { KEY_LIMITS } from '../../../utils/planLimits'

export default defineEventHandler(async (event) => {
  await requireDashboardUser(event, ['admin'])
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const body = await readBody<{ name?: string }>(event).catch(() => ({} as { name?: string }))
  const name = body?.name?.trim() || 'Storefront'

  const merchant = await db.merchant.findUnique({
    where: { id },
    include: { _count: { select: { apiKeys: true } } },
  })
  if (!merchant) {
    throw createError({ statusCode: 404, message: 'Merchant not found' })
  }

  const limit = KEY_LIMITS[merchant.plan] ?? KEY_LIMITS.trial!
  // Soft plan limit — a concurrent double-mint could momentarily exceed it by
  // one. Acceptable: keys are operator-created, the cap is a billing nudge not
  // a security boundary, and revoke is one click.
  if (merchant._count.apiKeys >= limit) {
    throw createError({
      statusCode: 402,
      message: `Plan "${merchant.plan}" allows ${limit} API key(s) — revoke one or upgrade`,
    })
  }

  const { plaintext, keyPrefix, keyHash } = generateApiKey()

  const apiKey = await db.apiKey.create({
    data: { merchantId: id, name, keyPrefix, keyHash },
    select: { id: true, name: true, keyPrefix: true, createdAt: true },
  })

  return {
    apiKey,
    /** Shown once — never retrievable again. */
    plaintext,
  }
})
