import { useFetch, useRuntimeConfig, computed } from '#imports'
import type { Brand } from '@commercejs/types'

/**
 * Brands composable.
 *
 * Hits `GET {apiBase}/brands` (T01 storefront API). Returns a reactive
 * ref populated during SSR via `useFetch`; the `refresh` helper
 * re-fetches on demand.
 *
 * @example
 * ```vue
 * <script setup>
 * const { brands, status, refresh } = useBrands()
 * </script>
 * ```
 */
export function useBrands() {
  const config = useRuntimeConfig()
  const apiBase = config.public.commerce?.apiBase || '/api/storefront'

  const { data, status, error, refresh } = useFetch<Brand[]>(
    `${apiBase}/brands`,
    { key: 'commerce:brands' },
  )

  return {
    brands: computed(() => data.value ?? []),
    status,
    loading: computed(() => status.value === 'pending'),
    error,
    refresh,
  }
}
