// ---------------------------------------------------------------------------
// Tenant middleware — binds the merchant context for every storefront request
// ---------------------------------------------------------------------------
//
// Runs before every request. For routes that need a merchant (storefront /
// commerce APIs):
//
//   1. resolveMerchant(event)                    → MerchantResolution
//   2. getPrismaClient(merchant.databaseUrl)     → cached Prisma client for
//                                                  the merchant's Neon branch
//   3. bindDb(client)                            → binds that client to the
//                                                  platform's AsyncLocalStorage
//                                                  so every downstream
//                                                  getDb() returns this
//                                                  merchant's client
//   4. ensureAdapter(merchant)                   → cached PlatformAdapter
//                                                  (built lazily, domain
//                                                  closures read ALS-bound
//                                                  client at call time)
//   5. event.context.merchant = merchant
//      event.context.adapter  = adapter.adapter
//      event.context.admin    = adapter.admin
//
// Admin / auth / control-DB routes are skipped (they don't need a tenant
// and shouldn't be routed to a merchant branch DB).
// ---------------------------------------------------------------------------

// defineEventHandler / createError / getRequestURL are Nitro auto-imports.
import { createPlatformAdapter, getPrismaClient, bindDb } from '@commercejs/platform'
import type { PlatformAdapterResult } from '@commercejs/platform'
import { resolveMerchant } from '../utils/tenant'
import type { MerchantContext } from '../utils/tenant'

// ---------------------------------------------------------------------------
// Skip list — routes that operate on the control DB / dashboard, not a
// merchant branch. Anything outside this list goes through tenant resolution.
// ---------------------------------------------------------------------------
const SKIP_PREFIXES = [
  '/api/merchants', // Control DB CRUD (Step 2)
  // '/api/admin' was here as a legacy proxy placeholder. Removed in merchant-admin T01:
  // /api/admin/* routes are now merchant-scoped and need tenant middleware to populate
  // event.context.admin. See .plans/merchant-admin/plan.md.
  '/api/auth', // Dashboard user auth
  '/api/armada', // Integration studio hooks
  '/api/_health', // Fly.io health probe (fly.toml)
  '/api/__nuxt_', // Nuxt internal
  '/_nuxt', // Asset requests
  '/__nuxt', // Nuxt dev
  '/_ipx', // Nuxt image
]

function shouldSkip(path: string): boolean {
  if (!path.startsWith('/api/')) return true // Non-API routes (SSR, assets) are Nuxt-handled
  return SKIP_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

// ---------------------------------------------------------------------------
// Adapter cache — one PlatformAdapter per merchant, rebuilt on URL change
// ---------------------------------------------------------------------------

interface CachedAdapter {
  databaseUrl: string
  adapter: PlatformAdapterResult
}

const adapterCache = new Map<string, CachedAdapter>()

async function ensureAdapter(merchant: MerchantContext): Promise<PlatformAdapterResult> {
  if (!merchant.databaseUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Merchant provisioning incomplete',
      message: `Merchant ${merchant.id} has no database_url — still provisioning?`,
    })
  }

  const cached = adapterCache.get(merchant.id)
  if (cached && cached.databaseUrl === merchant.databaseUrl) {
    return cached.adapter
  }

  const adapter = await createPlatformAdapter({
    connectionString: merchant.databaseUrl,
    currency: merchant.currency,
    locale: merchant.locale,
  })
  adapterCache.set(merchant.id, { databaseUrl: merchant.databaseUrl, adapter })
  return adapter
}

/** Clear the adapter cache for one merchant (e.g. after a DB URL change). */
export function invalidateAdapterCache(merchantId: string): void {
  adapterCache.delete(merchantId)
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (shouldSkip(path)) return

  const resolution = await resolveMerchant(event)
  if (!resolution) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Merchant not found',
      message: 'No merchant matched this host / API key. Check your DNS or X-Commerce-Key header.',
    })
  }

  const { merchant } = resolution

  if (merchant.status !== 'active') {
    throw createError({
      statusCode: merchant.status === 'provisioning' ? 503 : 403,
      statusMessage: `Merchant status: ${merchant.status}`,
      message:
        merchant.status === 'provisioning'
          ? 'This store is still being set up. Try again in a moment.'
          : `This store is ${merchant.status}.`,
    })
  }

  const prismaClient = getPrismaClient(merchant.databaseUrl!)
  bindDb(prismaClient)

  const { adapter, admin } = await ensureAdapter(merchant)

  event.context.merchant = merchant
  event.context.adapter = adapter
  event.context.admin = admin
})
