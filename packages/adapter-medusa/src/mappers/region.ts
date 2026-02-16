// ---------------------------------------------------------------------------
// Region mapper — MedusaRegion → Commerce.js StoreInfo + Country
// ---------------------------------------------------------------------------

import type { StoreInfo, Country } from '@commercejs/types'
import type { MedusaRegion } from '../types.js'

/** Map Medusa regions → Commerce.js StoreInfo */
export function mapMedusaRegionsToStoreInfo(regions: MedusaRegion[], storeName = 'Medusa Store'): StoreInfo {
  // Build currencies from all regions
  const currencySet = new Map<string, boolean>()
  regions.forEach((r, i) => {
    if (!currencySet.has(r.currency_code)) {
      currencySet.set(r.currency_code, i === 0)
    }
  })

  const currencies = Array.from(currencySet.entries()).map(([code, isDefault]) => ({
    code: code.toUpperCase(),
    symbol: code.toUpperCase(),
    isDefault,
  }))

  // Derive country from first region
  const firstCountry = regions[0]?.countries?.[0]

  return {
    name: { ar: storeName, en: storeName },
    description: null,
    logo: null,
    currencies,
    locales: [
      { code: 'en', name: 'English', direction: 'ltr' as const, isDefault: true },
    ],
    country: firstCountry?.iso_2 ?? 'US',
  }
}

/** Map Medusa region countries → Commerce.js Country[] */
export function mapMedusaRegionsToCountries(regions: MedusaRegion[]): Country[] {
  const seen = new Set<string>()
  const countries: Country[] = []

  for (const region of regions) {
    for (const c of region.countries ?? []) {
      if (seen.has(c.iso_2)) continue
      seen.add(c.iso_2)

      countries.push({
        id: c.iso_2,
        code: c.iso_2.toUpperCase(),
        iso3: c.iso_3.toUpperCase(),
        name: { ar: c.display_name, en: c.display_name },
        flag: null,
        callingCode: null,
        currency: region.currency_code.toUpperCase(),
        capital: null,
      })
    }
  }

  return countries
}
