// ---------------------------------------------------------------------------
// GET  /api/merchants — list all merchants
// POST /api/merchants — create a new merchant (control-DB row only;
//                       Neon branch + commerce schema are provisioned
//                       asynchronously by the BullMQ worker — Step 6)
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError } from 'h3'
import { useDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDB()

  if (event.method === 'GET') {
    return db.merchant.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  const body = await readBody<{
    name: string
    email: string
    subdomain?: string
    plan?: string
    currency?: string
    locale?: string
  }>(event)

  if (!body.name || !body.email) {
    throw createError({ statusCode: 400, message: 'name and email are required' })
  }

  const subdomain = (body.subdomain ?? body.name)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!subdomain) {
    throw createError({ statusCode: 400, message: 'subdomain could not be derived from name' })
  }

  try {
    return await db.merchant.create({
      data: {
        name: body.name,
        email: body.email,
        subdomain,
        plan: body.plan ?? 'trial',
        currency: body.currency ?? 'SAR',
        locale: body.locale ?? 'ar-SA',
        // status defaults to 'provisioning' until the BullMQ worker (Step 6)
        // creates a Neon branch and runs migrations against it.
      },
    })
  }
  catch (error: any) {
    if (error?.code === 'P2002') {
      throw createError({ statusCode: 409, message: 'email or subdomain already in use' })
    }
    console.error('[merchants] create failed:', error?.message ?? error)
    throw createError({
      statusCode: 500,
      message: `Failed to create merchant: ${error?.message ?? 'Unknown error'}`,
    })
  }
})
