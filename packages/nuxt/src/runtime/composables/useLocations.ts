import { useState, readonly } from '#imports'
import type { Ref } from 'vue'
import type { StoreLocation } from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { useAdapter } from './useAdapter'

/**
 * Store locations composable.
 * Fetches physical store locations / branches for store locator
 * and in-store pickup features.
 *
 * @example
 * ```vue
 * <script setup>
 * const { locations, loading, refresh } = useLocations()
 * onMounted(() => refresh())
 * </script>
 * ```
 */
export function useLocations() {
  const adapter = useAdapter()

  const locations = useState<StoreLocation[]>('commerce:locations', () => [])
  const loading = useState<boolean>('commerce:locations:loading', () => false)
  const error = useState<CommerceError | null>('commerce:locations:error', () => null)

  /** Fetch (or refresh) all store locations */
  async function refresh() {
    loading.value = true
    error.value = null
    try {
      locations.value = await adapter.getStoreLocations()
    } catch (err) {
      const e = isCommerceError(err)
        ? err
        : new CommerceError(
            err instanceof Error ? err.message : String(err),
            'UNKNOWN',
            undefined,
            err,
          )
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return {
    locations: readonly(locations) as Readonly<Ref<StoreLocation[]>>,
    loading: readonly(loading),
    error: readonly(error),
    refresh,
  }
}
