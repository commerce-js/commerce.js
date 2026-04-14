// ---------------------------------------------------------------------------
// /api/merchants/:id/domains — custom domain CRUD (control-DB only)
// ---------------------------------------------------------------------------
// GET    → list this merchant's domains
// POST   → register a domain (verified=false, sslStatus='pending')
// DELETE → remove a domain by id
//
// Actual TLS / DNS provisioning is performed by the merchant-provisioner
// (Step 6) via the Fly.io certs API. This route only manages control-DB
// rows; verification is updated out-of-band by the worker once Fly returns
// the certificate state.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { useDB } from '../../../utils/db'

const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

export default defineEventHandler(async (event) => {
  const db = useDB()
  const merchantId = getRouterParam(event, 'id')!

  // Verify merchant exists
  const merchant = await db.merchant.findUnique({ where: { id: merchantId } })
  if (!merchant) {
    throw createError({ statusCode: 404, message: 'Merchant not found' })
  }

  if (event.method === 'GET') {
    return db.domain.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'asc' },
    })
  }

  if (event.method === 'POST') {
    const body = await readBody<{ domain: string }>(event)
    if (!body.domain) {
      throw createError({ statusCode: 400, message: 'domain is required' })
    }

    const domain = body.domain.toLowerCase().trim()
    if (!DOMAIN_PATTERN.test(domain)) {
      throw createError({ statusCode: 400, message: 'Invalid domain format' })
    }

    try {
      return await db.domain.create({
        data: { merchantId, domain },
      })
    }
    catch (error: any) {
      if (error?.code === 'P2002') {
        throw createError({ statusCode: 409, message: 'Domain already registered' })
      }
      throw error
    }
  }

  if (event.method === 'DELETE') {
    const body = await readBody<{ domainId: string }>(event)
    if (!body.domainId) {
      throw createError({ statusCode: 400, message: 'domainId is required' })
    }

    try {
      await db.domain.delete({ where: { id: body.domainId } })
      return { success: true }
    }
    catch (error: any) {
      if (error?.code === 'P2025') {
        throw createError({ statusCode: 404, message: 'Domain not found' })
      }
      throw error
    }
  }
})
