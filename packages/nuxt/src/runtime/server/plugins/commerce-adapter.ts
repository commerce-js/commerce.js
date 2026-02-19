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
  const adapterName = process.env.COMMERCE_ADAPTER
    || process.env.NUXT_COMMERCE_ADAPTER
    || (runtimeConfig as any).commerceAdapter
    || 'salla'

  console.log('[commerce] Initializing adapter:', adapterName)

  if (adapterName === 'platform') {
    const platform = await import('@commercejs/platform')
    const { createPlatformAdapter, seedPrisma } = platform

    const dbUrl = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL
    const dbPath = process.env.COMMERCE_DB_PATH || process.env.NUXT_COMMERCE_DB_PATH || './store.db'
    const connectionString = dbUrl || dbPath
    const isNeon = dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))

    console.log('[commerce] Database driver:', isNeon ? 'neon' : 'sqlite')
    console.log('[commerce] Connection string provided:', !!connectionString)

    // For Neon: init client → migrate → create adapter → seed
    // For SQLite: migrate → create adapter → seed (initPrisma is sync)
    if (isNeon) {
      // 1. Init the Neon Prisma client (migrateNeon needs it)
      console.log('[commerce] Initializing Neon Prisma client...')
      const { initPrismaNeon } = await import('@commercejs/platform')
      await initPrismaNeon(connectionString)
      console.log('[commerce] Neon Prisma client initialized')

      // 2. Migrate (tables must exist before adapter seeds admin)
      console.log('[commerce] Running Neon migrations...')
      const { migrateNeon } = await import('@commercejs/platform')
      await migrateNeon()
      console.log('[commerce] Neon migrations complete')
    } else {
      const { migratePrisma } = await import('@commercejs/platform')
      await migratePrisma()
    }

    // 3. Create adapter (seeds initial admin user, skips client init since already done)
    console.log('[commerce] Creating platform adapter...')
    const result = await createPlatformAdapter({
      currency: process.env.COMMERCE_CURRENCY || 'SAR',
      connectionString,
    })

    _adapter = result.adapter
    _adminApi = result.admin
    console.log('[commerce] Platform adapter created successfully')

    // 4. Seed demo data
    try {
      const db = isNeon
        ? (await import('@commercejs/platform')).getNeonDb()
        : undefined
      await seedPrisma(db)
      console.log('[commerce] Demo data seeded successfully')
    } catch (err: any) {
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

