// ---------------------------------------------------------------------------
// CORS middleware — only applies to /api/storefront/*
// ---------------------------------------------------------------------------
//
// Self-hosted merchants run their own Nuxt storefront against the hosted API
// (see .plans/storefront-eaas/plan.md — "Self-Hosted Developer Flow"). Their
// browser-side requests cross origins. This middleware permits:
//
//   - any Origin in dev (or any localhost/*.local Origin)
//   - in prod: the resolved merchant's canonical subdomain URL + any
//     verified custom-domain row for that merchant
//
// Unknown Origins get NO Access-Control-Allow-Origin header, so the browser
// blocks the request. Credentials (cookies) are allowed so the buyer session
// rides cross-origin when the merchant's storefront domain is permitted.
//
// Runs alphabetically BEFORE tenant.ts, so we can't read event.context.merchant.
// Instead we call resolveMerchant() directly — the result is LRU-cached, so
// the tenant middleware's second lookup in the same request is free.
// ---------------------------------------------------------------------------

// defineEventHandler, getRequestURL, getHeader, setResponseHeader, setResponseStatus
// are Nitro auto-imports.
import process from 'node:process'
import { useDB } from '../utils/db'
import { resolveMerchant } from '../utils/tenant'
import type { MerchantContext } from '../utils/tenant'

const STOREFRONT_PREFIX = '/api/storefront'
const ALLOWED_METHODS = 'GET, POST, PATCH, PUT, DELETE, OPTIONS'
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Commerce-Key'

/** Cache of verified custom-domain origins per merchant. Short TTL. */
const originCache = new Map<string, { origins: Set<string>, expires: number }>()
const ORIGIN_CACHE_TTL_MS = 60_000

function baseHost(): string {
  return process.env.COMMERCEJS_BASE_HOST ?? 'commercejs.cloud'
}

async function allowedOriginsForMerchant(merchant: MerchantContext): Promise<Set<string>> {
  const cached = originCache.get(merchant.id)
  if (cached && cached.expires > Date.now()) return cached.origins

  const origins = new Set<string>()
  const sub = `${merchant.subdomain}.${baseHost()}`
  origins.add(`https://${sub}`)
  origins.add(`http://${sub}`)

  const db = useDB()
  const domains = await db.domain.findMany({
    where: { merchantId: merchant.id, verified: true },
    select: { domain: true },
  })
  for (const { domain } of domains) {
    origins.add(`https://${domain}`)
    origins.add(`http://${domain}`)
  }

  originCache.set(merchant.id, { origins, expires: Date.now() + ORIGIN_CACHE_TTL_MS })
  return origins
}

function isDevOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.endsWith('.local')
  }
  catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith(STOREFRONT_PREFIX)) return

  const method = event.node.req.method ?? 'GET'
  const origin = getHeader(event, 'origin')

  // Same-origin — no CORS needed. Short-circuit the OPTIONS preflight.
  if (!origin) {
    if (method === 'OPTIONS') {
      setResponseStatus(event, 204)
      return ''
    }
    return
  }

  let allowOrigin: string | null = null

  if (import.meta.dev || isDevOrigin(origin)) {
    allowOrigin = origin
  }
  else {
    // Ordering: this middleware runs before tenant.ts, so context.merchant
    // isn't populated yet. Resolve directly — result is LRU-cached.
    const resolution = await resolveMerchant(event).catch(() => null)
    if (resolution) {
      const allowed = await allowedOriginsForMerchant(resolution.merchant)
      if (allowed.has(origin)) allowOrigin = origin
    }
  }

  if (!allowOrigin) {
    // Origin supplied but not allowed — omit CORS headers so the browser
    // blocks. Preflight still needs a 2xx to complete the fetch lifecycle.
    if (method === 'OPTIONS') {
      setResponseStatus(event, 204)
      return ''
    }
    return
  }

  setResponseHeader(event, 'Access-Control-Allow-Origin', allowOrigin)
  setResponseHeader(event, 'Vary', 'Origin')
  setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
  setResponseHeader(event, 'Access-Control-Allow-Methods', ALLOWED_METHODS)
  setResponseHeader(event, 'Access-Control-Allow-Headers', ALLOWED_HEADERS)
  setResponseHeader(event, 'Access-Control-Max-Age', '86400')

  if (method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
