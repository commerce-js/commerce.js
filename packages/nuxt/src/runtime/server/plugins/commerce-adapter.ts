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

  const adapterName = process.env.COMMERCE_ADAPTER || process.env.NUXT_COMMERCE_ADAPTER || 'salla'

  if (adapterName === 'platform') {
    // Platform adapter — native CommerceJS engine
    // Auto-detects driver from DATABASE_URL (sqlite or neon)
    const platform = await import('@commercejs/platform')
    const { createPlatformAdapter, seedPrisma } = platform

    const dbUrl = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL
    const dbPath = process.env.COMMERCE_DB_PATH || process.env.NUXT_COMMERCE_DB_PATH || './store.db'

    // Use DATABASE_URL for Neon/Postgres, fall back to local SQLite path
    const connectionString = dbUrl || dbPath
    const isNeon = dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))

    // Run migrations FIRST — tables must exist before adapter seeds admin
    if (isNeon) {
      const { migrateNeon } = await import('@commercejs/platform')
      await migrateNeon()
    } else {
      const { migratePrisma } = await import('@commercejs/platform')
      await migratePrisma()
    }

    // NOW create the adapter (this also seeds the initial admin user)
    const result = await createPlatformAdapter({
      currency: process.env.COMMERCE_CURRENCY || 'SAR',
      connectionString,
    })

    _adapter = result.adapter
    _adminApi = result.admin

    // Auto-seed demo data if the database is fresh (no products yet)
    try {
      await seedPrisma()
      console.log('[commerce] Demo data seeded successfully')
    } catch (err: any) {
      // Already seeded or seed error — log for debugging
      if (err?.code !== 'P2002') {
        console.warn('[commerce] Seed skipped:', err?.message || err)
      }
    }
  } else {
    // Salla adapter (default)
    const { SallaAdapter } = await import('@commercejs/adapter-salla')

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
  }

  return _adapter!
}

export default defineNitroPlugin((nitroApp) => {
  // Initialize on startup (deferred singleton)
  _initPromise = initAdapter()

  nitroApp.hooks.hook('request', async (event) => {
    if (!_adapter) {
      await _initPromise
    }
    ;(event.context as any)._commerceAdapter = _adapter
    ;(event.context as any)._commerceAdmin = _adminApi
  })
})
