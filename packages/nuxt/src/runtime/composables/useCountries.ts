import { useState, readonly, useRuntimeConfig } from '#imports'
import type { Ref } from 'vue'
import type { Country } from '@commercejs/types'
import { CommerceError, isCommerceError } from '@commercejs/types'

/**
 * Countries composable.
 * Fetches supported countries for address forms and international shipping.
 * Uses $fetch against the REST API endpoint so it works on both SSR and client.
 *
 * @example
 * ```vue
 * <script setup>
 * const { countries, loading, refresh } = useCountries()
 * onMounted(() => refresh())
 * </script>
 * ```
 */
export function useCountries() {
  const config = useRuntimeConfig()
  const apiBase = (config.public as any).commerceApiBase || '/api/_commerce'

  const countries = useState<Country[]>('commerce:countries', () => [])
  const loading = useState<boolean>('commerce:countries:loading', () => false)
  const error = useState<CommerceError | null>('commerce:countries:error', () => null)

  /** Fetch (or refresh) all supported countries */
  async function refresh() {
    loading.value = true
    error.value = null
    try {
      countries.value = await $fetch<Country[]>(`${apiBase}/countries`)
    } catch (err) {
      console.error('[useCountries] Failed to fetch countries:', err)
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
    countries: readonly(countries) as Readonly<Ref<Country[]>>,
    loading: readonly(loading),
    error: readonly(error),
    refresh,
  }
}
