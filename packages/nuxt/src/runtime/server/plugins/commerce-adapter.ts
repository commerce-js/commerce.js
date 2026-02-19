// ---------------------------------------------------------------------------
// Nitro server plugin — injects the commerce adapter into every request
// ---------------------------------------------------------------------------
// This plugin runs once at server startup, creates the adapter instance,
// and attaches it to every incoming request's event context so that
// useServerAdapter(event) can retrieve it in API route handlers.

import type { CommerceAdapter } from '@commercejs/types'

let _adapter: CommerceAdapter | null = null
let _adminApi: any = null
let _initPromise: Promise<CommerceAdapter> | null = null

async function initAdapter(): Promise<CommerceAdapter> {
  if (_adapter) return _adapter

  // Use Nuxt runtime config as primary, process.env as fallback
  const runtimeConfig = useRuntimeConfig()
  const commerceConfig = (runtimeConfig as any).commerce || {}

  const adapterName = commerceConfig.adapter
    || process.env.COMMERCE_ADAPTER
    || process.env.NUXT_COMMERCE_ADAPTER
    || 'salla'

  console.log('[commerce] Initializing adapter:', adapterName)

  if (adapterName === 'platform') {
    const platform = await import('@commercejs/platform')
    const { createPlatformAdapter, seedPrisma, getDb } = platform

    const connectionString = commerceConfig.databaseUrl
      || process.env.DATABASE_URL
      || process.env.NUXT_DATABASE_URL
    if (!connectionString) {
      throw new Error('[@commercejs/nuxt] DATABASE_URL is required for platform adapter.')
    }

    console.log('[commerce] Database: PostgreSQL (Neon)')

    // 1. Run programmatic migrations (creates tables if they don't exist)
    console.log('[commerce] Running migrations...')
    const { migratePrisma } = await import('@commercejs/platform')
    // initPrisma is called by createPlatformAdapter; we need to init first for migrations
    const { initPrisma } = await import('@commercejs/platform')
    await initPrisma(connectionString)
    await migratePrisma()
    console.log('[commerce] Migrations complete')

    // 2. Create adapter (seeds initial admin user)
    console.log('[commerce] Creating platform adapter...')
    const currency = commerceConfig.currency
      || process.env.COMMERCE_CURRENCY
      || 'SAR'

    const result = await createPlatformAdapter({
      currency,
      connectionString,
    })

    _adapter = result.adapter
    _adminApi = result.admin
    console.log('[commerce] Platform adapter created successfully')

    // 3. Seed demo data
    try {
      await seedPrisma(getDb())
      console.log('[commerce] Demo data seeded successfully')
    } catch (err: any) {
      if (err?.code !== 'P2002') {
        console.warn('[commerce] Seed skipped:', err?.message || err)
      }
    }
  } else {
    // Salla adapter (default)
    const { SallaAdapter } = await import('@commercejs/adapter-salla')

    const token = commerceConfig.sallaToken
      || process.env.SALLA_TOKEN
      || process.env.NUXT_SALLA_TOKEN
    if (!token) {
      throw new Error(
        '[@commercejs/nuxt] SALLA_TOKEN environment variable is required. ' +
        'Set it in your .env file or via NUXT_SALLA_TOKEN.',
      )
    }

    _adapter = new SallaAdapter({
      accessToken: token,
      refreshToken: commerceConfig.sallaRefreshToken || process.env.SALLA_REFRESH_TOKEN || process.env.NUXT_SALLA_REFRESH_TOKEN,
      clientId: commerceConfig.sallaClientId || process.env.SALLA_CLIENT_ID || process.env.NUXT_SALLA_CLIENT_ID,
      clientSecret: commerceConfig.sallaSecret || process.env.SALLA_SECRET || process.env.NUXT_SALLA_SECRET,
      locale: (commerceConfig.sallaLocale || process.env.SALLA_LOCALE || process.env.NUXT_SALLA_LOCALE || 'ar') as 'ar' | 'en',
    })
  }

  return _adapter!
}

export default defineNitroPlugin((nitroApp) => {
  // Initialize on startup (deferred singleton)
  _initPromise = initAdapter().catch((err) => {
    console.error('[commerce] Adapter initialization FAILED:', err)
    throw err
  })

  nitroApp.hooks.hook('request', async (event) => {
    if (!_adapter) {
      try {
        await _initPromise
      } catch (err) {
        console.error('[commerce] Adapter unavailable due to init failure:', err)
      }
    }
    ;(event.context as any)._commerceAdapter = _adapter
    ;(event.context as any)._commerceAdmin = _adminApi
  })
})
