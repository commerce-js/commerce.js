// ---------------------------------------------------------------------------
// Storefront hostname proxy — routes merchant traffic to the store process
// ---------------------------------------------------------------------------
//
// Single-binary topology (see fly.toml): each Fly machine runs a `start.sh`
// supervisor that launches two node processes side-by-side — the dashboard
// on :3000 and the storefront on :3001. Fly's edge delivers ALL HTTPS
// traffic for the app to the dashboard, regardless of subdomain; this
// middleware decides per-request whether the dashboard keeps the request
// or hands it off to the storefront over localhost.
//
// Routing rules (in order):
//
//   1. API paths (`/api/*`) always stay on the dashboard. The dashboard
//      owns `/api/storefront/*` (T01 handlers). Proxying API traffic to
//      the storefront would create a loop — the storefront's own module
//      proxy (T02) forwards /api/storefront/** back to the dashboard, so
//      bouncing API requests through the storefront first is gratuitous.
//
//   2. Platform hosts (`app.commercejs.cloud` & siblings from
//      PLATFORM_HOSTS) fall through to the dashboard. That's where the
//      merchant admin UI lives; the storefront has nothing to serve for
//      these hosts.
//
//   3. Everything else — merchant subdomains like `acme.commercejs.cloud`
//      and verified custom domains — is a storefront page request
//      (home, product detail, cart, etc.). Proxy to the store process
//      with `X-Forwarded-Host` set so the storefront's own SSR-time
//      calls to `/api/storefront/*` carry the merchant host back to the
//      dashboard's tenant resolver (which reads `xForwardedHost: true`).
//
// STOREFRONT_ORIGIN env override exists for dev (point at a different port
// / host) and for forward-compat if we ever split the storefront back out
// to a separate Fly process group. Defaults to localhost:3001 for the
// supervised single-machine topology.
// ---------------------------------------------------------------------------

// defineEventHandler, getRequestHost, getRequestURL, proxyRequest are
// Nitro auto-imports.
import process from 'node:process'
import { PLATFORM_HOSTS } from '../utils/tenant'

const STOREFRONT_ORIGIN = (process.env.STOREFRONT_ORIGIN || 'http://localhost:3001').replace(/\/$/, '')

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // API traffic — never proxied. Dashboard handlers answer directly.
  if (path.startsWith('/api/') || path === '/api') return

  const host = (getRequestHost(event, { xForwardedHost: true }) || '')
    .split(':')[0]
    .toLowerCase()

  // Empty or reserved host → dashboard handles (UI, health, etc.)
  if (!host || PLATFORM_HOSTS.has(host)) return

  // Merchant host on a non-API path → storefront renders the page.
  const target = `${STOREFRONT_ORIGIN}${path}${url.search}`
  return proxyRequest(event, target, {
    // X-Forwarded-Host flows from here → storefront SSR → storefront's
    // T02 proxy → back to dashboard `/api/storefront/*`, where tenant
    // resolution reads it via getRequestHost({ xForwardedHost: true }).
    headers: { 'x-forwarded-host': host },
  })
})
