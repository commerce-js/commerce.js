import { useNuxtApp } from '#imports'
import type { CommerceAdapter } from '@commercejs/types'

/**
 * Returns the active CommerceAdapter instance.
 * On the client, returns null — composables should use useState (hydrated)
 * and $fetch for client-side refreshes.
 */
export function useAdapter(): CommerceAdapter | null {
  const nuxtApp = useNuxtApp()
  const adapter = nuxtApp.$commerce as CommerceAdapter | undefined

  if (!adapter && import.meta.server) {
    throw new Error(
      '[@commercejs/core] No commerce adapter available. ' +
      'Make sure you have installed and configured an adapter package ' +
      '(e.g., @commercejs/adapter-salla, @commercejs/adapter-zid).',
    )
  }

  return adapter || null
}

