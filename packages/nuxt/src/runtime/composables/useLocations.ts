import { useFetch, useRuntimeConfig, computed } from '#imports'
import type { StoreLocation } from '@commercejs/types'

/**
 * Store locations composable.
 *
 * Hits `GET {apiBase}/locations` (T01 storefront API). For store locator
 * and in-store pickup UIs. SSR-friendly via `useFetch`.
 *
 * @example
 * ```vue
 * <script setup>
 * const { locations, status, refresh } = useLocations()
 * </script>
 * ```
 */
export function useLocations() {
  const config = useRuntimeConfig()
  const apiBase = config.public.commerce?.apiBase || '/api/storefront'

  const { data, status, error, refresh } = useFetch<StoreLocation[]>(
    `${apiBase}/locations`,
    { key: 'commerce:locations' },
  )

  return {
    locations: computed(() => data.value ?? []),
    status,
    loading: computed(() => status.value === 'pending'),
    error,
    refresh,
  }
}
