import { useFetch, useRuntimeConfig } from '#imports'
import type { StoreInfo } from '@commercejs/types'

/**
 * Store information composable.
 * Fetches store-level metadata: name, logo, currencies, locales.
 * Uses the server API route `/api/_commerce/store`.
 */
export function useStoreInfo() {
  const config = useRuntimeConfig()
  const apiBase = config.public.commerce?.apiBase || '/api/_commerce'

  const { data: store, status, refresh, error } = useFetch<StoreInfo>(
    `${apiBase}/store`,
    { key: 'commerce:store' },
  )

  return {
    store,
    loading: computed(() => status.value === 'pending'),
    error,
    refresh,
  }
}
