// ---------------------------------------------------------------------------
// Brands domain — product brand listing
// ---------------------------------------------------------------------------

import type { Brand } from '@commercejs/types'
import { findBrands } from '../database/index.js'
import { localized, img } from './helpers.js'

export function createBrandsDomain() {
  return {
    async getBrands(): Promise<Brand[]> {
      const rows = await findBrands()
      return rows.map((row: any) => ({
        id: row.id,
        name: localized(row.name, row.nameAr),
        slug: row.slug,
        logo: row.logo ? img(row.logo, row.name) : null,
        description: row.description ? localized(row.description, row.descriptionAr) : null,
        isActive: row.isActive ?? true,
      }))
    },
  }
}
