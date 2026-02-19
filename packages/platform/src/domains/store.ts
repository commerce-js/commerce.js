// ---------------------------------------------------------------------------
// Store domain — store metadata
// ---------------------------------------------------------------------------

import type { StoreInfo } from '@commercejs/types'
import { findStoreInfo, createStoreInfo as dbCreateStoreInfo } from '../database/index.js'
import { localized, img } from './helpers.js'

export function createStoreDomain() {
  return {
    async getStoreInfo(): Promise<StoreInfo> {
      let row = await findStoreInfo('default')

      if (!row) {
        await dbCreateStoreInfo({
          id: 'default',
          name: 'My Store',
          currency: 'SAR',
          locale: 'en',
          timezone: 'Asia/Riyadh',
        })
        row = await findStoreInfo('default')
      }

      if (!row) throw new Error('Failed to initialize store info')

      return {
        name: localized(row.name, row.nameAr),
        description: row.description ? localized(row.description, row.descriptionAr) : null,
        logo: row.logo ? img(row.logo, 'Store logo') : null,
        currencies: ((row.supportedCurrencies ?? [row.currency]) as string[]).map((c: string) => ({
          code: c,
          symbol: c === 'SAR' ? 'ر.س' : c === 'AED' ? 'د.إ' : c,
          isDefault: c === row.currency,
        })),
        locales: ((row.supportedLocales ?? [row.locale]) as string[]).map((l: string) => ({
          code: l,
          name: l === 'ar' ? 'العربية' : l === 'en' ? 'English' : l,
          direction: l === 'ar' ? 'rtl' as const : 'ltr' as const,
          isDefault: l === row.locale,
        })),
        country: 'SA',
      }
    },
  }
}
