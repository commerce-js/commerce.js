import { countryMeta } from '../../data/country-meta'

defineRouteMeta({
  openAPI: {
    tags: ['Geography'],
    description: 'List all countries',
  },
})

export default defineCommerceHandler(async (_event, adapter) => {
  const countries = await adapter.getCountries()

  // Enrich with flag URLs and ISO3 codes from static data
  return countries.map((c: any) => {
    const meta = countryMeta[c.code]
    return {
      ...c,
      flag: c.flag || meta?.flag || null,
      iso3: c.iso3 || meta?.iso3 || null,
    }
  })
})
