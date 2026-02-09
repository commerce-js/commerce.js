// ---------------------------------------------------------------------------
// Store / brand information types
// ---------------------------------------------------------------------------

import type { Maybe, Image, LocalizedString } from './common.js'

/** Supported currency */
export interface StoreCurrency {
  /** ISO 4217 code (e.g., "SAR", "AED", "KWD") */
  code: string
  /** Display symbol (e.g., "ر.س", "د.إ") */
  symbol: string
  /** Is this the store's default currency? */
  isDefault: boolean
}

/** Supported locale */
export interface StoreLocale {
  /** ISO 639-1 code (e.g., "ar", "en") */
  code: string
  /** Display name in that language (e.g., "العربية") */
  name: string
  /** Text direction */
  direction: 'ltr' | 'rtl'
  isDefault: boolean
}

/** Store-level information */
export interface StoreInfo {
  /** Store name */
  name: LocalizedString
  /** Store description / tagline */
  description: Maybe<LocalizedString>
  /** Store logo */
  logo: Maybe<Image>
  /** Supported currencies */
  currencies: StoreCurrency[]
  /** Supported locales */
  locales: StoreLocale[]
  /** Store's country (ISO 3166-1 alpha-2) */
  country: string
}
