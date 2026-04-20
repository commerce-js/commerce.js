// ---------------------------------------------------------------------------
// Salla → Category mapper
// ---------------------------------------------------------------------------

import type { Category, LocalizedString, Image, Maybe } from '@commercejs/types'
import type { SallaRawCategory } from '../types.js'

function toLocalized(value: string | null, locale: string = 'ar'): LocalizedString {
  if (locale === 'en') return { ar: '', en: value ?? '' }
  return { ar: value ?? '', en: '' }
}

/** Map Salla raw category → unified Category */
export function mapSallaCategory(raw: SallaRawCategory, locale: string = 'ar'): Category {
  const image: Maybe<Image> = raw.image
    ? { url: raw.image.url, alt: raw.image.alt ?? '' }
    : null

  return {
    id: String(raw.id),
    name: toLocalized(raw.name, locale),
    slug: raw.slug,
    description: raw.description ? toLocalized(raw.description, locale) : null,
    image,
    parentId: raw.parent_id ? String(raw.parent_id) : null,
    children: [],
    productCount: raw.products_count,
    sortOrder: raw.sort_order ?? 0,
  }
}
