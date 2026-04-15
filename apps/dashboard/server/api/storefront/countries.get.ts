// GET /api/storefront/countries — list of countries the merchant ships to,
// enriched with flag URLs and ISO 3166-1 alpha-3 codes.
import { defineStorefrontHandler } from '../../utils/storefrontHandler'
import { countryMeta } from '../../data/geo'

export default defineStorefrontHandler(async (_event, { adapter }) => {
  const countries = await adapter.getCountries()
  return countries.map((c) => {
    const meta = countryMeta[c.code]
    return {
      ...c,
      flag: (c as any).flag || meta?.flag || null,
      iso3: (c as any).iso3 || meta?.iso3 || null,
    }
  })
})
