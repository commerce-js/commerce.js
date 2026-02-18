// Server-side utility to get the admin API instance in Nitro handlers
import { createError } from 'h3'
import type { H3Event } from 'h3'

/**
 * Get the AdminAPI instance from the Nitro event context.
 * Only available when using the platform adapter.
 */
export function useAdminAPI(event: H3Event) {
  const admin = (event.context as any)._commerceAdmin

  if (!admin) {
    throw createError({
      statusCode: 501,
      message: '[@commercejs/nuxt] Admin API is only available with the platform adapter.',
    })
  }

  return admin
}
