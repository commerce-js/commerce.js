// ---------------------------------------------------------------------------
// Shared delivery provider resolution for hosted-checkout
// ---------------------------------------------------------------------------
// Resolves a DeliveryProvider instance from runtime config / env vars.
// Lazy-loads the provider package to keep the import graph clean.
// ---------------------------------------------------------------------------

import type { DeliveryProvider } from '@commercejs/types'

export async function resolveDeliveryProvider(providerId?: string): Promise<DeliveryProvider> {
  const config = useRuntimeConfig()
  const id = providerId
    || (config as any).deliveryProvider
    || process.env.DELIVERY_PROVIDER
    || 'armada'

  if (id === 'armada') {
    const { ArmadaDeliveryProvider } = await import('@commercejs/delivery-armada')
    return new ArmadaDeliveryProvider({
      accessToken: (config as any).armadaAccessToken || process.env.ARMADA_ACCESS_TOKEN || '',
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
