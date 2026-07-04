// ---------------------------------------------------------------------------
// GET  /api/merchants/:id/api-keys — list this merchant's API keys (metadata)
// POST /api/merchants/:id/api-keys — mint a new key (returns the secret ONCE)
// ---------------------------------------------------------------------------
//
// API keys authenticate server-to-server storefront/commerce calls via the
// `X-Commerce-Key` header (see utils/tenant.ts → resolveByApiKey). Only the
// SHA-256 of the key is stored; the plaintext is shown exactly once at mint.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { useDB } from '../../../../utils/db'
import { requireDashboardSession } from '../../../../utils/authorize'
import { generateApiKey } from '../../../../utils/apiKey'
import { PUBLIC_API_KEY_SELECT } from '../../../../utils/apiKeySelect'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const merchantId = getRouterParam(event, 'id')!

  if (event.method === 'GET') {
    await requireDashboardSession(event, 'read')
    return db.apiKey.findMany({
      where: { merchantId },
      select: PUBLIC_API_KEY_SELECT,
      orderBy: { createdAt: 'desc' },
    })
  }

  // Minting a credential is a privileged action — admin only.
  await requireDashboardSession(event, 'admin')

  const body = await readBody<{ name?: string }>(event)
  const name = body?.name?.trim()
  if (!name) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }

  const merchant = await db.merchant.findUnique({ where: { id: merchantId }, select: { id: true } })
  if (!merchant) {
    throw createError({ statusCode: 404, message: 'Merchant not found' })
  }

  const { fullKey, keyPrefix, keyHash } = generateApiKey()
  const created = await db.apiKey.create({
    data: { merchantId, name, keyPrefix, keyHash },
    select: PUBLIC_API_KEY_SELECT,
  })

  // `key` is returned ONCE and never persisted in plaintext — the operator
  // must copy it now. Every later read returns metadata only.
  return { ...created, key: fullKey }
})
