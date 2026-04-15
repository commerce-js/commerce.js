// ---------------------------------------------------------------------------
// Merchant config bootstrap — early validation of the hosted-tenant wiring.
// ---------------------------------------------------------------------------
//
// The storefront is a pure client of a hosted CommerceJS Cloud tenant. At
// Nitro startup this plugin:
//
//   1. Confirms NUXT_COMMERCE_REMOTE_API_BASE is set — without it, nothing
//      resolves and every request 500s from the module's proxy. Better to
//      fail loudly at boot than silently per-request.
//   2. Pings the upstream `/store` endpoint once so the failure mode (auth,
//      DNS, wrong subdomain) surfaces on process start, not under traffic.
//   3. Logs a one-line confirmation with the merchant's name + default
//      locale so deployments are easy to verify from Fly/systemd logs.
//
// It does NOT cache the StoreInfo into runtimeConfig — `useRuntimeConfig()`
// is frozen at runtime and can't be mutated. The layout resolves locale /
// direction / name per-render via `useStoreInfo()` (the composable's
// useFetch cache means the overhead is a single SSR lookup per process).
// ---------------------------------------------------------------------------

import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import type { StoreInfo } from '@commercejs/types'

export default defineNitroPlugin(async (_nitroApp) => {
  const runtime = useRuntimeConfig() as any
  const remoteApiBase: string = runtime?.commerce?.remoteApiBase
    || process.env.NUXT_COMMERCE_REMOTE_API_BASE
    || ''
  const apiKey: string = runtime?.commerce?.apiKey
    || process.env.NUXT_COMMERCE_API_KEY
    || ''

  if (!remoteApiBase) {
    console.warn('[storefront] NUXT_COMMERCE_REMOTE_API_BASE is not set — proxy will 500 on first request.')
    return
  }

  try {
    const url = `${remoteApiBase.replace(/\/$/, '')}/store`
    const headers: Record<string, string> = {}
    if (apiKey) headers['x-commerce-key'] = apiKey

    const store = await $fetch<StoreInfo>(url, { headers })
    const defaultLocale = store.locales?.find(l => l.isDefault) || store.locales?.[0]
    const name = (store.name as any)?.en || (store.name as any)?.ar || '(unnamed)'

    console.log(
      `[storefront] Connected to ${remoteApiBase} — merchant="${name}" locale=${defaultLocale?.code ?? 'en'} dir=${defaultLocale?.direction ?? 'ltr'}`,
    )
  }
  catch (err: any) {
    console.warn(
      `[storefront] Upstream check failed for ${remoteApiBase}:`,
      err?.statusCode || '',
      err?.statusMessage || err?.message || err,
    )
  }
})
