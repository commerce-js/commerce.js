// ---------------------------------------------------------------------------
// Nitro server plugin — injects the commerce adapter into every request
// ---------------------------------------------------------------------------
// This plugin runs once at server startup, creates the adapter instance,
// and attaches it to every incoming request's event context so that
// useServerAdapter(event) can retrieve it in API route handlers.

import type { CommerceAdapter } from '@commercejs/types'
import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'

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
    const { createPlatformAdapter, initDrizzle, getDrizzleDb, migrateDrizzle } = platform

    const connectionString = commerceConfig.databaseUrl
      || process.env.DATABASE_URL
      || process.env.NUXT_DATABASE_URL
    if (!connectionString) {
      throw new Error('[@commercejs/nuxt] DATABASE_URL is required for platform adapter.')
    }

    console.log('[commerce] Database: PostgreSQL (Neon via Drizzle)')

    // 1. Initialize Drizzle connection
    initDrizzle(connectionString)

    // 2. Run migrations (idempotent — CREATE TABLE IF NOT EXISTS)
    console.log('[commerce] Running database migrations...')
    await migrateDrizzle(connectionString)
    console.log('[commerce] Migrations complete')

    // 3. Create adapter (seeds initial admin user)
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

    // 4. Seed demo data
    try {
      const { seedDrizzle } = await import('@commercejs/platform')
      await seedDrizzle(getDrizzleDb())
      console.log('[commerce] Demo data seeded successfully')
    } catch (err: any) {
      // 23505 = PostgreSQL unique constraint violation (data already seeded)
      if (err?.code !== '23505') {
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

let _initError: Error | null = null

export default defineNitroPlugin((nitroApp) => {
  // NOTE: Do NOT call initAdapter() here — Cloudflare Workers forbid
  // async I/O (WebSocket, fetch, connect) in global scope.
  // Instead, we lazily initialize on the first incoming request.

  nitroApp.hooks.hook('request', async (event) => {
    if (!_adapter && !_initError) {
      if (!_initPromise) {
        _initPromise = initAdapter().catch((err) => {
          console.error('[commerce] Adapter initialization FAILED:', err)
          _initError = err instanceof Error ? err : new Error(String(err))
          throw err
        })
      }
      try {
        await _initPromise
      } catch {
        // error already stored in _initError
      }
    }

    if (_initError) {
      ;(event.context as any)._commerceInitError = _initError
    }
    ;(event.context as any)._commerceAdapter = _adapter
    ;(event.context as any)._commerceAdmin = _adminApi
  })
})
