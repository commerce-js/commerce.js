import { useState, readonly } from '#imports'
import type { Ref } from 'vue'
import type { Brand } from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'
import { useAdapter } from './useAdapter'

/**
 * Brands composable.
 * Fetches all brands from the commerce platform.
 *
 * @example
 * ```vue
 * <script setup>
 * const { brands, loading, refresh } = useBrands()
 * onMounted(() => refresh())
 * </script>
 * ```
 */
export function useBrands() {
  const adapter = useAdapter()

  const brands = useState<Brand[]>('commerce:brands', () => [])
  const loading = useState<boolean>('commerce:brands:loading', () => false)
  const error = useState<CommerceError | null>('commerce:brands:error', () => null)

  /** Fetch (or refresh) all brands */
  async function refresh() {
    loading.value = true
    error.value = null
    try {
      brands.value = await adapter.getBrands()
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
    brands: readonly(brands) as Readonly<Ref<Brand[]>>,
    loading: readonly(loading),
    error: readonly(error),
    refresh,
  }
}
