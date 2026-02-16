/**
 * Locale helper composable.
 * Picks the correct string from a LocalizedString based on current locale.
 */
import type { LocalizedString, Maybe } from '@commercejs/types'

export function useLocalizedString() {
  // For now, default to 'en'. In the future, this could read from
  // the route, cookie, or Nuxt i18n module.
  const locale = ref<'ar' | 'en'>('en')

  /** Pick the best available localized string */
  function t(value: Maybe<LocalizedString> | undefined): string {
    if (!value) return ''
    return value[locale.value] || value.en || value.ar || ''
  }

  return { locale, t }
}
