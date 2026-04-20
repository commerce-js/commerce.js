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

/**
 * Per-merchant theming tokens (v1: CSS custom properties only).
 * Each field is optional — adapters that don't support theming
 * omit the whole object, and individual null fields fall back to
 * the storefront's default palette.
 */
export interface StoreTheme {
  /** Primary brand color (CSS color string, typically hex). */
  primaryColor: Maybe<string>
  /** Accent color used for highlights / secondary CTAs. */
  accentColor: Maybe<string>
  /** Font-family string (e.g. 'Inter', 'Cairo'); falls back to system-ui. */
  fontFamily: Maybe<string>
  /** Absolute URL to a hero-banner image shown on the storefront homepage. */
  heroImageUrl: Maybe<string>
  /** Hero headline in English. */
  heroHeadingEn: Maybe<string>
  /** Hero headline in Arabic. */
  heroHeadingAr: Maybe<string>
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
  /** Per-merchant theming tokens. Absent when the adapter has no concept of theming. */
  theme?: Maybe<StoreTheme>
}
