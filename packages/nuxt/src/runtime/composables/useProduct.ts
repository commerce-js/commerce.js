import { useFetch, useRuntimeConfig, toValue, computed } from '#imports'
import type { MaybeRef } from 'vue'
import type { GetProductParams, Product } from '@commercejs/types'

/**
 * Fetch a single product by ID or slug.
 *
 * Uses the server API route `/api/_commerce/products/:id` so it works
 * on both SSR and client-side navigation.
 *
 * @example
 * ```vue
 * <script setup>
 * const route = useRoute()
 * const { data: product, status } = useProduct({ id: route.params.slug })
 * </script>
 * ```
 */
export function useProduct(params: MaybeRef<GetProductParams>) {
  const config = useRuntimeConfig()
  const apiBase = config.public.commerce?.apiBase || '/api/_commerce'

  const productId = computed(() => {
    const p = toValue(params)
    return p.id || p.slug || ''
  })

  return useFetch<Product>(
    () => `${apiBase}/products/${productId.value}`,
    {
      key: computed(() => `product-${productId.value}`).value,
      watch: [productId],
    },
  )
}
