// ---------------------------------------------------------------------------
// Salla → Country mapper
// ---------------------------------------------------------------------------

import type { Country } from '@commercejs/types'
import type { SallaRawCountry } from '../types.js'

export function mapSallaCountry(raw: SallaRawCountry): Country {
  return {
    id: String(raw.id),
    code: raw.code,
    iso3: null, // enriched in the API route from static data
    name: { ar: raw.name, en: raw.name_en || raw.name },
    flag: null, // enriched in the API route from static data
    callingCode: raw.mobile_code || null,
    currency: null, // Salla doesn't include currency in country response
    capital: raw.capital,
  }
}
