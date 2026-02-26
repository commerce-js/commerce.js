// ---------------------------------------------------------------------------
// Shared delivery provider resolution for hosted-checkout
// ---------------------------------------------------------------------------
// Resolves a DeliveryProvider instance by reading the access token from:
//   1. Runtime config / env vars (ARMADA_ACCESS_TOKEN)
//   2. Neon database `integrations` table (fallback for cloud-managed tokens)
// ---------------------------------------------------------------------------

import type { DeliveryProvider } from '@commercejs/types'
import { neon } from '@neondatabase/serverless'

/**
 * Fetch the Armada access token from the integrations table.
 * Returns null if not found or DB not configured.
 */
async function getArmadaTokenFromDb(): Promise<string | null> {
  const dbUrl = process.env.DATABASE_URL
    || process.env.NUXT_DATABASE_URL
    || (useRuntimeConfig() as any).databaseUrl

  if (!dbUrl) return null

  try {
    const sql = neon(dbUrl)
    const rows = await sql`
      SELECT access_token FROM integrations
      WHERE provider = 'armada' AND status = 'connected'
      LIMIT 1
    `
    return rows[0]?.access_token || null
  } catch {
    return null
  }
}

export async function resolveDeliveryProvider(providerId?: string): Promise<DeliveryProvider> {
  const config = useRuntimeConfig()
  const id = providerId
    || (config as any).deliveryProvider
    || process.env.DELIVERY_PROVIDER
    || 'armada'

  if (id === 'armada') {
    // Try env/config first, then fall back to DB
    let accessToken = (config as any).armadaAccessToken
      || process.env.ARMADA_ACCESS_TOKEN
      || ''

    if (!accessToken) {
      accessToken = await getArmadaTokenFromDb() || ''
    }

    if (!accessToken) {
      throw createError({
        statusCode: 500,
        message: 'Armada access token not configured. Install Armada from the dashboard first.',
      })
    }

    const { ArmadaDeliveryProvider } = await import('@commercejs/delivery-armada')
    return new ArmadaDeliveryProvider({
      accessToken,
      baseUrl: (config as any).armadaBaseUrl || process.env.ARMADA_BASE_URL,
    })
  }

  if (id === 'parcel') {
    const { ParcelDeliveryProvider } = await import('@commercejs/delivery-parcel')
    return new ParcelDeliveryProvider({
      clientId: (config as any).parcelClientId || process.env.PARCEL_CLIENT_ID || '',
      clientSecret: (config as any).parcelClientSecret || process.env.PARCEL_CLIENT_SECRET || '',
      baseUrl: (config as any).parcelBaseUrl || process.env.PARCEL_BASE_URL,
    })
  }

  throw createError({
    statusCode: 400,
    message: `Unknown delivery provider: ${id}`,
  })
}
