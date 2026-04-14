// ---------------------------------------------------------------------------
// Module augmentation — tenant fields on h3's per-request context.
// ---------------------------------------------------------------------------
// The `tenant` middleware attaches these; typed routes read them with full
// IntelliSense. Admin / auth / control-DB routes that skip tenancy see
// undefined here, as expected.
// ---------------------------------------------------------------------------

import type { CommerceAdapter } from '@commercejs/types'
import type { AdminAPI } from '@commercejs/platform'
import type { MerchantContext } from '../utils/tenant'

declare module 'h3' {
  interface H3EventContext {
    /** Resolved merchant for this request, attached by middleware/tenant.ts. */
    merchant?: MerchantContext
    /** Storefront adapter scoped to the merchant's Neon branch DB. */
    adapter?: CommerceAdapter
    /** Admin API scoped to the same merchant DB (catalog / orders / etc.). */
    admin?: AdminAPI
  }
}

export {}
