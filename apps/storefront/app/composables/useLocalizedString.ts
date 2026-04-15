/**
 * Locale helper composable.
 * Picks the correct string from a LocalizedString based on the merchant's
 * default locale (resolved via `useStoreInfo`). The composable's useFetch
 * is cached per SSR pass, so reading `store.value` here is free after the
 * first call.
 */
import type { LocalizedString, Maybe } from '@commercejs/types'

export function useLocalizedString() {
  const { store } = useStoreInfo()

  const locale = computed<'ar' | 'en'>(() => {
    const locs = store.value?.locales
    const def = locs?.find(l => l.isDefault) || locs?.[0]
    return def?.code === 'ar' ? 'ar' : 'en'
  })

  /** Pick the best available localized string */
  function t(value: Maybe<LocalizedString> | undefined): string {
    if (!value) return ''
    return value[locale.value] || value.en || value.ar || ''
  }

  return { locale, t }
}
