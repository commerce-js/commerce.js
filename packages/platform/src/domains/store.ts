// ---------------------------------------------------------------------------
// Store domain — store metadata
// ---------------------------------------------------------------------------

import type { StoreInfo, StoreTheme } from '@commercejs/types'
import { findStoreInfo, createStoreInfo as dbCreateStoreInfo } from '../database/index.js'
import { localized, img } from './helpers.js'

function mapStoreTheme(row: any): StoreTheme | null {
  const primaryColor = row.primaryColor ?? null
  const accentColor = row.accentColor ?? null
  const fontFamily = row.fontFamily ?? null
  const heroImageUrl = row.heroImageUrl ?? null
  const heroHeadingEn = row.heroHeadingEn ?? null
  const heroHeadingAr = row.heroHeadingAr ?? null
  // Return a theme object when ANY token is set so the storefront can
  // consume whatever is defined and fall back on the rest. When every
  // token is null, skip the object entirely — downstream code treats
  // that as "use the default palette".
  if (!primaryColor && !accentColor && !fontFamily && !heroImageUrl && !heroHeadingEn && !heroHeadingAr) {
    return null
  }
  return { primaryColor, accentColor, fontFamily, heroImageUrl, heroHeadingEn, heroHeadingAr }
}

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
        theme: mapStoreTheme(row),
      }
    },
  }
}
