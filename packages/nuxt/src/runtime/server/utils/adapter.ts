// Server-side utility to get the adapter instance in Nitro handlers
import type { CommerceAdapter } from '@commercejs/types'
import { createError } from 'h3'
import type { H3Event } from 'h3'

/**
 * Get the CommerceAdapter instance from the Nitro event context.
 * Adapter packages register themselves in the server context.
 */
export function useServerAdapter(event: H3Event): CommerceAdapter {
  const adapter = (event.context as any)._commerceAdapter as CommerceAdapter | undefined

  if (!adapter) {
    throw createError({
      statusCode: 500,
      message: '[@commercejs/nuxt] No commerce adapter configured on the server.',
    })
  }

  return adapter
}
