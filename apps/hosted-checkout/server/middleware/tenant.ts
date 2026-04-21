// ---------------------------------------------------------------------------
// Tenant middleware — per-request merchant resolution for hosted checkout
// ---------------------------------------------------------------------------
// Resolves the merchant from a `merchant` query param or `cjs_merchant`
// cookie, looks it up in the control DB, and sets the merchant's Prisma
// client on `event.context.db`. The platform's `getDb()` reads from there
// via the registered event resolver (see server/plugins/platform-event-resolver.ts).
//
// Why event.context.db (not bindDb)?
// --------------------------------------------------------------------------
// `bindDb()` uses `AsyncLocalStorage.enterWith()` which doesn't reliably
// propagate across Nitro's middleware→handler async boundary — the store
// is set on the middleware's async frame, not the dispatcher's
// continuation. `event.context` is Nitro-native per-event state, set
// before dispatch and visible everywhere that can call `useEvent()`.
//
// Concurrency safety:
// --------------------------------------------------------------------------
// Per-event context is scoped to the single request's event object —
// zero cross-request leakage under concurrent multi-tenant traffic. No
// module-level singletons, no race.
// ---------------------------------------------------------------------------

import { getPrismaClient } from '@commercejs/platform'
import { findMerchantBySubdomain } from '../utils/control-db'

// SKIP_PREFIXES bypass tenant resolution entirely — the handler downstream
// is expected to run without a merchant-scoped Prisma client.
//
// `/api/sessions` is the in-memory demo-session surface (see
// server/api/sessions/index.post.ts) — it accepts an optional `merchantId`
// in the body and falls back to `useTapProviderFromEnv()` when absent,
// so it never needs the cookie/query-driven tenant resolution the
// hosted-merchant flows (cart-pay, cart-confirm, webhooks) depend on.
// Without this skip, the demo index page 400s on "Missing merchant
// parameter" before the handler's env-fallback runs.
const SKIP_PREFIXES = ['/_checkout/', '/_nuxt/', '/__nuxt', '/favicon', '/api/sessions']

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Static assets — no tenant needed
  if (SKIP_PREFIXES.some(p => path.startsWith(p))) return

  // ── Resolve merchant identifier ─────────────────────────────────────
  const query = getQuery(event)
  let subdomain = (query.merchant as string) || getCookie(event, 'cjs_merchant') || ''

  if (!subdomain) {
    if (path.startsWith('/api/')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing merchant parameter',
        message: 'The `merchant` query parameter or `cjs_merchant` cookie is required.',
      })
    }
    // For page requests, let the page handle the missing merchant
    // gracefully (the demo index page doesn't require one).
    return
  }

  // ── Look up in control DB ───────────────────────────────────────────
  const merchant = await findMerchantBySubdomain(subdomain)
  if (!merchant) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Merchant not found',
      message: `No active merchant with subdomain "${subdomain}".`,
    })
  }

  if (merchant.status !== 'active') {
    throw createError({
      statusCode: 503,
      statusMessage: 'Merchant unavailable',
      message: `Merchant "${subdomain}" is not active (status: ${merchant.status}).`,
    })
  }

  // ── Bind the merchant's Prisma client on event.context ──────────────
  // getPrismaClient caches clients by connection string, so repeat
  // requests for the same merchant reuse the same PrismaNeon adapter.
  event.context.db = getPrismaClient(merchant.database_url)
  event.context.merchant = merchant

  // Refresh the cookie so subsequent same-session requests (POST /api/cart-pay,
  // POST /api/profile/otp/send) don't need the merchant query param.
  setCookie(event, 'cjs_merchant', subdomain, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  })
})
