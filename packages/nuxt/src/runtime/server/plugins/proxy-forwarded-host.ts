// ---------------------------------------------------------------------------
// Forwarded-host capture for the remote-mode proxy
// ---------------------------------------------------------------------------
//
// Problem this plugin solves:
//
//   In hosted-EaaS deploys (see .plans/storefront-eaas/tasks/T04.md), the
//   storefront Nitro process sits behind the dashboard's hostname-proxy
//   middleware. The dashboard proxies merchant-subdomain traffic to
//   http://localhost:3001 with `X-Forwarded-Host: <merchant>` so tenant
//   resolution on the far side can still identify the merchant.
//
//   During SSR the storefront calls `useFetch('/api/storefront/*')`,
//   which Nuxt routes through the in-process remote-mode proxy handler
//   (runtime/server/proxy.ts). The proxy then HTTP-forwards that call
//   to `remoteApiBase` — typically another localhost port on the same
//   machine, where the dashboard's tenant middleware reads the
//   forwarded host off the request.
//
//   The catch: Nuxt's in-process $fetch creates a fresh event whose
//   Host is `localhost` and which does NOT inherit the outer SSR
//   event's `x-forwarded-host` header OR the outer `event.context`.
//   By the time the proxy handler runs, both surfaces report
//   `localhost` — tenant resolution 404s the merchant.
//
// How this plugin fixes it:
//
//   Uses Node's AsyncLocalStorage to bind the outer request's host for
//   the full lifetime of the request (SSR render + every in-process
//   $fetch Nuxt spawns along the way). AsyncLocalStorage is the only
//   mechanism that reliably crosses the Nuxt fetch boundary — event
//   context doesn't propagate across it. The proxy handler reads the
//   active store value via `getForwardedHost()` and injects it as
//   `x-forwarded-host` on the outbound call to the dashboard.
// ---------------------------------------------------------------------------

import { AsyncLocalStorage } from 'node:async_hooks'
import { defineNitroPlugin } from 'nitropack/runtime'
import { getHeader, getRequestHost } from 'h3'

const store = new AsyncLocalStorage<{ host: string }>()

/** Called by runtime/server/proxy.ts. Returns the outer SSR request's
 *  externally-facing host, or undefined when invoked outside any
 *  tracked request (e.g. startup pings). */
export function getForwardedHost(): string | undefined {
  return store.getStore()?.host
}

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('request', (event) => {
    // AsyncLocalStorage.getStore() returns the CURRENT store frame if
    // one is already active — i.e. we're inside a nested in-process
    // $fetch dispatch. Don't overwrite it with the inner request's
    // localhost host; keep the outer merchant host in scope.
    if (store.getStore()) return

    const fromHeader = getHeader(event, 'x-forwarded-host')
    const fromHost = getRequestHost(event, { xForwardedHost: true })
    const host = fromHeader || fromHost
    if (!host || /^localhost(:\d+)?$/i.test(host)) return

    // Enter the store synchronously for the remainder of this event's
    // async chain. Nitro awaits the 'request' hook, so subsequent
    // handler/middleware/composable work runs inside this frame.
    store.enterWith({ host })
  })
})
