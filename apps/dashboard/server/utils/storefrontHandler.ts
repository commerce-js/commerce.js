// ---------------------------------------------------------------------------
// defineStorefrontHandler — thin wrapper for /api/storefront/* routes
// ---------------------------------------------------------------------------
//
// Responsibilities:
//   1. Assert `event.context.adapter` (populated by tenant middleware) is
//      present — if not, the request reached a storefront route without
//      tenant resolution, which is a bug.
//   2. Assert `event.context.admin` (the per-merchant AdminAPI) is present
//      — used for customer-scoped reads (orders, profile) that can't rely
//      on the adapter's singleton customer state.
//   3. Hand both plus the resolved merchant to the handler.
//
// Handlers throw CommerceError / Zod / other errors freely; the global
// error plugin (server/plugins/commerce-errors.ts) formats them into h3
// responses.
// ---------------------------------------------------------------------------

import type { H3Event, EventHandler } from 'h3'
import type { CommerceAdapter, AdminAPI } from '@commercejs/platform'
import type { MerchantContext } from './tenant'

export interface StorefrontContext {
  adapter: CommerceAdapter
  admin: AdminAPI
  merchant: MerchantContext
}

export function defineStorefrontHandler<T>(
  handler: (event: H3Event, ctx: StorefrontContext) => T | Promise<T>,
): EventHandler {
  return defineEventHandler(async (event) => {
    const { adapter, admin, merchant } = event.context

    if (!adapter || !admin || !merchant) {
      // Tenant middleware would have thrown 404/503 already if this path
      // were truly unresolvable — this guard catches misconfigured skip
      // lists or routes mounted outside /api/storefront.
      throw createError({
        statusCode: 500,
        statusMessage: 'Tenant context missing',
        message: 'Storefront route invoked without resolved merchant.',
      })
    }

    return handler(event, { adapter, admin, merchant })
  })
}
