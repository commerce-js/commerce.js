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
import { PLATFORM_HOSTS, CHECKOUT_HOSTS } from '../utils/tenant'

const STOREFRONT_ORIGIN = (process.env.STOREFRONT_ORIGIN || 'http://localhost:3001').replace(/\/$/, '')
const CHECKOUT_ORIGIN = (process.env.CHECKOUT_ORIGIN || 'http://localhost:3002').replace(/\/$/, '')

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  const host = (getRequestHost(event, { xForwardedHost: true }) || '')
    .split(':')[0]
    .toLowerCase()

  // ── Hosted checkout ──────────────────────────────────────────────────
  // Checkout hosts get ALL traffic (pages AND /api/*) proxied to :3002.
  // This diverges from the storefront pattern where /api/* stays on the
  // dashboard: the checkout has its own API routes (cart, cart-pay,
  // profile, OTP) that need its own tenant-scoped DB context.
  if (CHECKOUT_HOSTS.has(host)) {
    const target = `${CHECKOUT_ORIGIN}${path}${url.search}`
    return proxyRequest(event, target, {
      headers: { 'x-forwarded-host': host },
    })
  }

  // ── Dashboard API ────────────────────────────────────────────────────
  // API traffic for non-checkout hosts stays on the dashboard. The
  // dashboard owns /api/storefront/* (T01 handlers) and /api/merchants/*.
  if (path.startsWith('/api/') || path === '/api') return

  // ── Platform hosts ───────────────────────────────────────────────────
  // Empty or reserved host → dashboard handles (admin UI, health, etc.)
  if (!host || PLATFORM_HOSTS.has(host)) return

  // ── Merchant storefront ──────────────────────────────────────────────
  // Merchant host on a non-API path → storefront renders the page.
  const target = `${STOREFRONT_ORIGIN}${path}${url.search}`
  return proxyRequest(event, target, {
    // X-Forwarded-Host flows from here → storefront SSR → storefront's
    // T02 proxy → back to dashboard `/api/storefront/*`, where tenant
    // resolution reads it via getRequestHost({ xForwardedHost: true }).
    headers: { 'x-forwarded-host': host },
  })
})
