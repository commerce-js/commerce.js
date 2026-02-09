// ---------------------------------------------------------------------------
// Salla → Brand mapper
// ---------------------------------------------------------------------------

import type { Brand, LocalizedString, Maybe, Image } from '@commercejs/types'
import type { SallaRawBrand } from '../types.js'

function toLocalized(value: string | null, locale: string = 'ar'): LocalizedString {
  if (locale === 'en') return { ar: '', en: value ?? '' }
  return { ar: value ?? '', en: '' }
}

export function mapSallaBrand(raw: SallaRawBrand, locale: string = 'ar'): Brand {
  const logo: Maybe<Image> = raw.logo ? { url: raw.logo, alt: raw.name } : null

  return {
    id: String(raw.id),
    name: toLocalized(raw.name, locale),
    slug: raw.slug ?? String(raw.id),
    logo,
    description: raw.description ? toLocalized(raw.description, locale) : null,
    isActive: raw.status === 'active',
  }
}
