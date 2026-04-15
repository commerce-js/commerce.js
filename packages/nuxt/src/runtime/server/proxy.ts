// ---------------------------------------------------------------------------
// Remote-mode catch-all proxy — forwards every /{apiBase}/** request to the
// configured `remoteApiBase` (typically CommerceJS Cloud).
// ---------------------------------------------------------------------------
//
// Why a server-side proxy and not a direct fetch from composables?
//
//   The browser would make a cross-origin request to `acme.commercejs.cloud`,
//   triggering CORS preflights and cookie-domain friction. By making every
//   composable call the local `apiBase` instead and having the Nuxt server
//   forward to the remote, browser traffic stays same-origin. Only the
//   Node→Node hop pays the network cost, and that happens server-side.
//
// What this handler does, per request:
//
//   1. Strips the local `apiBase` prefix from `event.path` and appends the
//      remainder (plus query string) to `remoteApiBase`.
//   2. Forwards the incoming request (method, body, headers, cookies) to
//      that URL. h3's `proxyRequest` streams bodies both ways.
//   3. Injects `X-Commerce-Key` from private runtime config so the remote
//      tenant middleware can resolve the merchant by API key even without
//      a matching host header.
//   4. Rewrites upstream Set-Cookie `Domain=` attributes to empty — the
//      buyer session cookie becomes host-only on the local origin, so the
//      browser stores and returns it on subsequent same-origin calls.
//
// This handler is only registered when `remoteApiBase` is configured
// (see `module.ts` — `isRemote` branch). Local-route mode never hits it.
// ---------------------------------------------------------------------------

import { defineEventHandler, proxyRequest, createError, getRequestURL } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event) as any
  const remoteApiBase = (config.commerce?.remoteApiBase || '').replace(/\/$/, '')
  const localApiBase = (config.commerce?.apiBase || '').replace(/\/$/, '')
  const apiKey = config.commerce?.apiKey || ''

  if (!remoteApiBase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Commerce remote mode misconfigured',
      message: '`remoteApiBase` is not set. Configure `commerce.remoteApiBase` or NUXT_COMMERCE_REMOTE_API_BASE.',
    })
  }

  // event.path starts with the localApiBase prefix by construction (the
  // handler is mounted at `${apiBase}/**`). Strip it to get the relative
  // path on the remote host. Preserve the query string.
  const url = getRequestURL(event)
  const relativePath = url.pathname.startsWith(localApiBase)
    ? url.pathname.slice(localApiBase.length)
    : url.pathname
  const target = `${remoteApiBase}${relativePath}${url.search}`

  // Inject X-Commerce-Key only when we have one. Forward all other
  // incoming headers as-is (h3 handles cookie + content-type + body).
  const headers: Record<string, string> = {}
  if (apiKey) headers['x-commerce-key'] = apiKey

  return proxyRequest(event, target, {
    headers,
    // Empty string drops the Domain attribute on Set-Cookie entirely, so
    // buyer session cookies from the remote land on the local origin.
    cookieDomainRewrite: '',
  })
})
