import { useFetch, useRuntimeConfig, toValue } from '#imports'
import type { MaybeRef } from 'vue'
import type { SearchParams, SearchResult } from '@commercejs/types'

/**
 * Search / list products with filters, sorting, and pagination.
 * Uses the server API route `/api/_commerce/products` so it works
 * on both SSR and client-side navigation.
 *
 * @param params - Reactive search parameters
 *
 * @example
 * ```vue
 * <script setup>
 * const filters = ref({ categoryId: 'cat-123', page: 1 })
 * const { data: result, status } = useProducts(filters)
 * // result.value?.products.items, result.value?.facets
 * </script>
 * ```
 */
export function useProducts(params: MaybeRef<SearchParams> = {}) {
  const config = useRuntimeConfig()
  const apiBase = config.public.commerce?.apiBase || '/api/_commerce'

  const queryParams = computed(() => {
    const p = toValue(params)
    const q: Record<string, string | number> = {}
    if (p.query) q.query = p.query
    if (p.categoryId) q.categoryId = p.categoryId
    if (p.page) q.page = p.page
    if (p.perPage) q.perPage = p.perPage
    if (p.sort) {
      q.sortField = p.sort.field
      q.sortDirection = p.sort.direction
    }
    return q
  })

  return useFetch<SearchResult>(
    () => `${apiBase}/products`,
    {
      key: computed(() => `products-${JSON.stringify(toValue(params))}`).value,
      query: queryParams,
      watch: [queryParams],
    },
  )
}
