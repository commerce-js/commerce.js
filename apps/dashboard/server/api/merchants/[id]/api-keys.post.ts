// ---------------------------------------------------------------------------
// POST /api/merchants/:id/api-keys — mint an API key
//
// Key format matches tenant.ts resolveByApiKey exactly:
//   <prefix>_<secret>   where prefix is the first underscore-token.
// Only the sha256 hash of the FULL key is stored; the plaintext is returned
// once. Storefronts send it as `X-Commerce-Key`.
// ---------------------------------------------------------------------------

import { randomBytes } from 'node:crypto'
import { createHash } from 'node:crypto'
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { useDB } from '../../../utils/db'
import { requireDashboardUser } from '../../../utils/session'

/** Per-plan API key allowance (enterprise = effectively unlimited). */
const KEY_LIMITS: Record<string, number> = {
  trial: 1,
  starter: 2,
  pro: 5,
  business: 20,
  enterprise: 100,
}

export default defineEventHandler(async (event) => {
  await requireDashboardUser(event)
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
  if (merchant._count.apiKeys >= limit) {
    throw createError({
      statusCode: 402,
      message: `Plan "${merchant.plan}" allows ${limit} API key(s) — revoke one or upgrade`,
    })
  }

  // Prefix must be unique as a bare token (tenant.ts splits on the first "_").
  const prefix = `cjs${randomBytes(5).toString('hex')}`
  const plaintext = `${prefix}_${randomBytes(24).toString('hex')}`

  const apiKey = await db.apiKey.create({
    data: {
      merchantId: id,
      name,
      keyPrefix: prefix,
      keyHash: createHash('sha256').update(plaintext).digest('hex'),
    },
    select: { id: true, name: true, keyPrefix: true, createdAt: true },
  })

  return {
    apiKey,
    /** Shown once — never retrievable again. */
    plaintext,
  }
})
