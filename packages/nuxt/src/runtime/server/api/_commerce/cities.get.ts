import { defineEventHandler, getQuery } from 'h3'
import { citiesByCountry } from '../../data/cities'

/**
 * GET /api/_commerce/cities?country=SA
 * Returns a list of city names for the given country ISO2 code.
 */
defineRouteMeta({
  openAPI: {
    tags: ['Geography'],
    description: 'List cities, optionally filtered by country',
    parameters: [
      { in: 'query', name: 'country', description: 'ISO2 country code (e.g. SA, US)', required: true },
    ],
  },
})

export default defineEventHandler((event) => {
  const { country } = getQuery(event) as { country?: string }

  if (!country) {
    return []
  }

  const code = country.toUpperCase()
  return citiesByCountry[code] ?? []
})
