// ---------------------------------------------------------------------------
// Salla → Country mapper
// ---------------------------------------------------------------------------

import type { Country } from '@commercejs/types'
import type { SallaRawCountry } from '../types.js'

export function mapSallaCountry(raw: SallaRawCountry): Country {
  return {
    id: String(raw.id),
    code: raw.code,
    name: { ar: raw.name, en: raw.name_en || raw.name },
    callingCode: raw.mobile_code || null,
    currency: null, // Salla doesn't include currency in country response
    capital: raw.capital,
  }
}
