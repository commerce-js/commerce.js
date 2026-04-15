// ---------------------------------------------------------------------------
// Storefront error formatter — global hook for /api/storefront/* errors
// ---------------------------------------------------------------------------
//
// Route handlers under /api/storefront/* throw errors freely: h3 errors
// (already formatted), CommerceErrors from the platform adapter, or bare
// Errors. Nitro's default serializer already converts thrown errors into
// `{ statusCode, statusMessage, message, data }` JSON — that shape is good
// enough for the storefront API surface.
//
// What we do here:
//
//   1. Log unformatted adapter errors (non-h3) server-side so we can trace
//      platform regressions — Nitro's default console output is minimal.
//   2. Convert uncaught CommerceErrors into h3 errors so Nitro's serializer
//      picks up the intended statusCode and the error code lands in `data`.
//
// We only intervene on storefront paths; dashboard / admin routes keep
// Nitro defaults so existing tooling is unaffected.
// ---------------------------------------------------------------------------

import { isCommerceError } from '@commercejs/types'

const STOREFRONT_PREFIX = '/api/storefront'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (err, ctx) => {
    const path = ctx?.event?.path || ''
    if (!path.startsWith(STOREFRONT_PREFIX)) return

    // h3 errors (statusCode set) already have a sensible shape.
    if (err && typeof err === 'object' && 'statusCode' in err) return

    // Convert CommerceError → structured h3 error so the client sees the
    // correct status + code instead of a generic 500.
    if (isCommerceError(err)) {
      ;(err as any).statusCode = err.statusCode ?? 500
      ;(err as any).statusMessage = err.code
      ;(err as any).data = { code: err.code }
      return
    }

    // Unknown error class — log full detail so we can diagnose. The
    // response stays a generic 500 (Nitro default).
    console.error('[storefront]', path, err)
  })
})
