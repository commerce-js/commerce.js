import { useFetch, useRuntimeConfig } from '#imports'
import type { Category } from '@commercejs/types'

/**
 * Fetch the category tree.
 * Uses the server API route `/api/_commerce/categories`.
 *
 * @example
 * ```vue
 * <script setup>
 * const { data: categories } = useCategories()
 * </script>
 * ```
 */
export function useCategories() {
  const config = useRuntimeConfig()
  const apiBase = config.public.commerce?.apiBase || '/api/_commerce'

  return useFetch<Category[]>(
    `${apiBase}/categories`,
    { key: 'categories' },
  )
}
