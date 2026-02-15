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
        iso3: row.iso3 ?? null,
        name: localized(row.name, row.nameAr),
        flag: row.flag ?? null,
        callingCode: row.callingCode ?? null,
        currency: row.currency ?? null,
        capital: row.capital ?? null,
      }))
    },
  }
}
