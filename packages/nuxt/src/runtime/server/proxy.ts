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
// This handler is only registered when the module is in remote mode
// (see `module.ts` — the `remoteMode` branch). Local-route mode doesn't
// register it, so its bundle impact is zero when unused.
// ---------------------------------------------------------------------------

import { defineEventHandler, proxyRequest, createError, getRequestURL, getRequestHost, getHeader } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { getForwardedHost } from './plugins/proxy-forwarded-host'

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

  // Inject X-Commerce-Key only when we have one. h3's proxyRequest
  // forwards the incoming event's headers automatically (minus a small
  // ignored set that doesn't include x-forwarded-host).
  const headers: Record<string, string> = {}
  if (apiKey) headers['x-commerce-key'] = apiKey

  // Preserve merchant host across Nuxt's in-process $fetch hop.
  //
  // During SSR Nuxt dispatches `useFetch('/api/storefront/*')` through
  // this local handler without going over real HTTP. The inner event
  // it hands us has Host=localhost and no x-forwarded-host — Nuxt
  // doesn't forward either across the boundary. If we sent that to the
  // hosted `remoteApiBase`, tenant resolution on the far side would
  // lose the merchant identity and 404.
  //
  // Priority, from most to least trusted:
  //   - AsyncLocalStorage set by proxy-forwarded-host on the OUTER
  //     request (survives the $fetch dispatch — the only channel that
  //     actually does).
  //   - x-forwarded-host on the current event (direct HTTP callers —
  //     e.g. the standalone self-hosted path, or a curl hitting
  //     /api/storefront/* on this process).
  //   - Host header (the caller is already on the merchant origin).
  // Localhost drops out so we don't poison upstream resolution with
  // the in-process dispatch's own noise.
  const fromAls = getForwardedHost()
  const fromHeader = getHeader(event, 'x-forwarded-host')
  const fromHost = getRequestHost(event, { xForwardedHost: true })
  const rawForwarded = fromAls || fromHeader || fromHost
  const forwardedHost = rawForwarded && !/^localhost(:\d+)?$/i.test(rawForwarded)
    ? rawForwarded
    : undefined
  if (forwardedHost) headers['x-forwarded-host'] = forwardedHost

  return proxyRequest(event, target, {
    headers,
    // Empty string drops the Domain attribute on Set-Cookie entirely, so
    // buyer session cookies from the remote land on the local origin.
    cookieDomainRewrite: '',
  })
})
