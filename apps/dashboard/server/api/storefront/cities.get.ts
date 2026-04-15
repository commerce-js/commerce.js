// GET /api/storefront/cities?country=SA — static city list for a country.
//
// Pure reference data — doesn't need tenant resolution, but runs through
// the storefront handler wrapper for consistency. Returns [] for unknown
// codes so the caller can render "type your city" without special-casing.
import { defineStorefrontHandler } from '../../utils/storefrontHandler'
import { citiesByCountry } from '../../data/geo'

export default defineStorefrontHandler((event) => {
  const { country } = getQuery(event) as { country?: string }
  if (!country) return []
  return citiesByCountry[country.toUpperCase()] ?? []
})
