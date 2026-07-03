// ---------------------------------------------------------------------------
// Tenant resolution — maps an incoming request to a merchant
// ---------------------------------------------------------------------------
//
// Resolution precedence (first match wins):
//   1. `X-Commerce-Key` header         → ApiKey lookup (keyPrefix → merchant)
//   2. Custom domain (verified only)   → Domain lookup → merchant
//   3. Subdomain on COMMERCEJS_BASE_HOST → Merchant.subdomain
//
// The resolved merchant row + config is cached in a bounded LRU
// (1000 entries, 60 s TTL) so hot storefronts don't hammer the control DB
// on every request. The cache is invalidated implicitly by TTL; explicit
// invalidation is available via `invalidateMerchantCache(id)` for when the
// control DB is mutated (e.g. plan change in the admin UI).
//
// Per-request binding of the merchant's Prisma client to the platform's
// AsyncLocalStorage happens in `server/middleware/tenant.ts` — this file
// only deals with resolution and caching.
// ---------------------------------------------------------------------------

// h3 helpers (getHeader, getRequestHost) are Nitro auto-imports — no `import from 'h3'` needed.
import process from 'node:process'
import { getHeader, getRequestHost } from 'h3'
import type { H3Event } from 'h3'
import { LRUCache } from 'lru-cache'
import { useDB } from './db'
import type { Merchant } from '../generated/prisma/client'

export type MerchantContext = Merchant

/** Host domains that are "the platform itself", not a merchant tenant. */
export const PLATFORM_HOSTS = new Set([
  'commercejs.cloud',
  'www.commercejs.cloud',
  'app.commercejs.cloud',
  'admin.commercejs.cloud',
  'dashboard.commercejs.cloud',
  'checkout.commercejs.cloud',
])

/**
 * Host domains served by the hosted-checkout process (:3002).
 * The proxy middleware routes ALL traffic (including /api/*) to the checkout
 * origin so the checkout's own API routes run in its tenant-scoped context.
 */
export const CHECKOUT_HOSTS = new Set([
  'checkout.commercejs.cloud',
])

/** Root host from which subdomains are derived. Override via env. */
function baseHost(): string {
  return process.env.COMMERCEJS_BASE_HOST ?? 'commercejs.cloud'
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const merchantCache = new LRUCache<string, MerchantContext>({
  max: 1000,
  ttl: 60_000, // 60 seconds
})

/**
 * Fetch a merchant by id from the control DB (LRU-cached, 60 s TTL).
 * Returns null if the merchant doesn't exist.
 */
export async function getMerchantConfig(id: string): Promise<MerchantContext | null> {
  const cached = merchantCache.get(id)
  if (cached) return cached

  const row = await useDB().merchant.findUnique({ where: { id } })
  if (!row) return null

  merchantCache.set(id, row)
  return row
}

/**
 * Invalidate one merchant (e.g. after an admin writes a new plan).
 * Call from any mutation route on `/api/merchants/:id`.
 */
export function invalidateMerchantCache(id: string): void {
  merchantCache.delete(id)
}

/** Clear the entire merchant cache. */
export function clearMerchantCache(): void {
  merchantCache.clear()
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/** Result of resolving a merchant from a request. */
export interface MerchantResolution {
  merchant: MerchantContext
  /** Which path was used — useful for logging and debugging. */
  via: 'api-key' | 'custom-domain' | 'subdomain'
}

/**
 * Resolve the merchant for an incoming request. Returns `null` if no tenant
 * hint is present or none of them match an active merchant. Callers decide
 * whether that's a 404 (storefront route) or just "this route doesn't need
 * a tenant" (admin / auth / health routes).
 *
 * Uses the LRU cache end-to-end so hot paths don't hit the control DB.
 */
export async function resolveMerchant(event: H3Event): Promise<MerchantResolution | null> {
  // 1. X-Commerce-Key header (server-to-server / API clients)
  const apiKey = getHeader(event, 'x-commerce-key')
  if (apiKey) {
    const resolved = await resolveByApiKey(apiKey)
    if (resolved) return { merchant: resolved, via: 'api-key' }
  }

  const host = getRequestHost(event, { xForwardedHost: true }).toLowerCase()

  // Strip any :port suffix for matching
  const hostNoPort = host.split(':')[0] ?? host

  if (!hostNoPort || PLATFORM_HOSTS.has(hostNoPort)) return null

  // 2. Custom domain (verified + SSL ready)
  const customDomainMatch = await resolveByCustomDomain(hostNoPort)
  if (customDomainMatch) return { merchant: customDomainMatch, via: 'custom-domain' }

  // 3. Subdomain of the platform base host (e.g. acme.commercejs.cloud)
  const base = baseHost()
  if (hostNoPort.endsWith(`.${base}`)) {
    const subdomain = hostNoPort.slice(0, -(base.length + 1))
    if (subdomain && !subdomain.includes('.')) {
      const resolved = await resolveBySubdomain(subdomain)
      if (resolved) return { merchant: resolved, via: 'subdomain' }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Internal lookups — each backed by the merchant cache
// ---------------------------------------------------------------------------

async function resolveBySubdomain(subdomain: string): Promise<MerchantContext | null> {
  const db = useDB()
  const row = await db.merchant.findUnique({ where: { subdomain } })
  if (!row) return null
  merchantCache.set(row.id, row)
  return row
}

async function resolveByCustomDomain(domain: string): Promise<MerchantContext | null> {
  const db = useDB()
  const match = await db.domain.findUnique({
    where: { domain },
    include: { merchant: true },
  })
  if (!match || !match.verified) return null
  merchantCache.set(match.merchant.id, match.merchant)
  return match.merchant
}

async function resolveByApiKey(apiKey: string): Promise<MerchantContext | null> {
  // API keys are formatted as `<prefix>_<secret>`. The prefix alone uniquely
  // identifies the key row; the full key is verified by hash comparison.
  const prefix = apiKey.split('_')[0]
  if (!prefix) return null

  const db = useDB()
  const rows = await db.apiKey.findMany({
    where: { keyPrefix: prefix },
    include: { merchant: true },
  })

  const { createHash } = await import('node:crypto')
  const hash = createHash('sha256').update(apiKey).digest('hex')
  const match = rows.find(r => r.keyHash === hash)
  if (!match) return null

  // Fire-and-forget lastUsed bump — don't block the request on it.
  void db.apiKey.update({
    where: { id: match.id },
    data: { lastUsed: new Date() },
  }).catch(() => { /* swallow — telemetry, not correctness */ })

  merchantCache.set(match.merchant.id, match.merchant)
  return match.merchant
}
