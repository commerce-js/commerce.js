// ---------------------------------------------------------------------------
// Salla → Payment mapper
// ---------------------------------------------------------------------------

import type { PaymentMethod, LocalizedString } from '@commercejs/types'
import type { SallaRawPaymentMethod } from '../types.js'

function toLocalized(value: string, locale: string = 'ar'): LocalizedString {
  if (locale === 'en') return { ar: '', en: value }
  return { ar: value, en: '' }
}

/** Map Salla raw payment method → unified PaymentMethod */
export function mapSallaPayment(raw: SallaRawPaymentMethod, locale: string = 'ar'): PaymentMethod {
  return {
    id: String(raw.id),
    name: toLocalized(raw.name, locale),
    type: raw.slug ?? 'custom',
    provider: raw.slug ?? 'salla',
    icon: raw.logo ?? null,
    installments: null,
  }
}
