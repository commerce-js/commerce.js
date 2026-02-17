// ---------------------------------------------------------------------------
// Salla → Shipping mapper
// ---------------------------------------------------------------------------

import type { ShippingMethod, LocalizedString, Price } from '@commercejs/types'
import type { SallaRawShippingCompany } from '../types.js'

function toLocalized(value: string | null, locale: string = 'ar'): LocalizedString {
  if (locale === 'en') return { ar: '', en: value ?? '' }
  return { ar: value ?? '', en: '' }
}

/** Map Salla raw shipping company → unified ShippingMethod */
export function mapSallaShipping(raw: SallaRawShippingCompany, locale: string = 'ar'): ShippingMethod {
  return {
    id: String(raw.id),
    name: toLocalized(raw.name, locale),
    provider: 'custom',
    fulfillmentType: 'shipping',
    estimatedDays: { min: 0, max: 0 }, // Salla doesn't expose this
    price: { amount: 0, currency: 'SAR', formatted: '0.00 SAR' },
    cashOnDelivery: false,
  }
}
