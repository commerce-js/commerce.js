// Server-side utility to get a delivery provider from the Nitro event context
import type { DeliveryProvider } from '@commercejs/types'
import { createError } from 'h3'
import type { H3Event } from 'h3'

/**
 * Get a registered DeliveryProvider from the event context.
 * Delivery providers are registered via a Nitro server plugin:
 *
 * ```ts
 * ;(event.context as any)._commerceDelivery = {
 *   armada: new ArmadaDeliveryProvider(config),
 *   parcel: new ParcelDeliveryProvider(config),
 * }
 * ;(event.context as any)._commerceDefaultDelivery = 'armada'
 * ```
 */
export function useServerDeliveryProvider(event: H3Event, providerId?: string): DeliveryProvider {
  const registry = (event.context as any)?._commerceDelivery as Record<string, DeliveryProvider> | undefined

  if (!registry || Object.keys(registry).length === 0) {
    throw createError({
      statusCode: 500,
      message: '[@commercejs/nuxt] No delivery providers configured. Register them in a Nitro server plugin.',
    })
  }

  const defaultId = (event.context as any)?._commerceDefaultDelivery as string | undefined
  const id = providerId ?? defaultId

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '[@commercejs/nuxt] No delivery provider specified and no default configured.',
    })
  }

  const provider = registry[id]
  if (!provider) {
    throw createError({
      statusCode: 404,
      message: `[@commercejs/nuxt] Delivery provider "${id}" is not registered.`,
    })
  }

  return provider
}
