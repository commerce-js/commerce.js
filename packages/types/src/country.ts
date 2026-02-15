// ---------------------------------------------------------------------------
// Country types — for address forms and locale resolution
// ---------------------------------------------------------------------------

import type { Id, LocalizedString, Maybe } from './common.js'

/** A country supported by the store */
export interface Country {
  id: Id
  /** ISO 3166-1 alpha-2 code (e.g., "SA", "AE") */
  code: string
  /** ISO 3166-1 alpha-3 code (e.g., "SAU", "ARE") */
  iso3: Maybe<string>
  /** Display name */
  name: LocalizedString
  /** URL to an SVG flag image */
  flag: Maybe<string>
  /** Phone calling code (e.g., "+966") */
  callingCode: Maybe<string>
  /** Default currency code (e.g., "SAR") */
  currency: Maybe<string>
  /** Capital city name */
  capital: Maybe<string>
}
