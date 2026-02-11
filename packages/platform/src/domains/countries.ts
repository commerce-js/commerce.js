// ---------------------------------------------------------------------------
// Countries domain — country listing for address forms
// ---------------------------------------------------------------------------

import type { Country } from '@commercejs/types'
import { findCountries } from '../database/index.js'
import { localized } from './helpers.js'

export function createCountriesDomain() {
  return {
    async getCountries(): Promise<Country[]> {
      const rows = await findCountries()
      return rows.map((row: any) => ({
        id: row.id,
        code: row.code,
        name: localized(row.name, row.nameAr),
        callingCode: row.callingCode ?? null,
        currency: row.currency ?? null,
        capital: row.capital ?? null,
      }))
    },
  }
}
