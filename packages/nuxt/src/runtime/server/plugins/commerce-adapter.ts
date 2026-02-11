// ---------------------------------------------------------------------------
// Nitro server plugin — injects the commerce adapter into every request
// ---------------------------------------------------------------------------
// This plugin runs once at server startup, creates the adapter instance,
// and attaches it to every incoming request's event context so that
// useServerAdapter(event) can retrieve it in API route handlers.

import { SallaAdapter } from '@commercejs/adapter-salla'

let _adapter: InstanceType<typeof SallaAdapter> | null = null

function getAdapter() {
  if (_adapter) return _adapter

  const token = process.env.SALLA_TOKEN || process.env.NUXT_SALLA_TOKEN
  if (!token) {
    throw new Error(
      '[@commercejs/nuxt] SALLA_TOKEN environment variable is required. ' +
      'Set it in your .env file or via NUXT_SALLA_TOKEN.',
    )
  }

  _adapter = new SallaAdapter({
    accessToken: token,
    refreshToken: process.env.SALLA_REFRESH_TOKEN || process.env.NUXT_SALLA_REFRESH_TOKEN,
    clientId: process.env.SALLA_CLIENT_ID || process.env.NUXT_SALLA_CLIENT_ID,
    clientSecret: process.env.SALLA_SECRET || process.env.NUXT_SALLA_SECRET,
    locale: (process.env.SALLA_LOCALE || process.env.NUXT_SALLA_LOCALE || 'ar') as 'ar' | 'en',
  })

  return _adapter
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    ;(event.context as any)._commerceAdapter = getAdapter()
  })
})
