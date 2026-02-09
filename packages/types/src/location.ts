// ---------------------------------------------------------------------------
// Store Location / Branch types — for pickup and store locator
// ---------------------------------------------------------------------------

import type { Id, LocalizedString, Maybe } from './common.js'

/** Geographic coordinates */
export interface Coordinates {
  lat: number
  lng: number
}

/** Working hours for a single day */
export interface WorkingHoursEntry {
  day: string
  from: Maybe<string>
  to: Maybe<string>
  isClosed: boolean
}

/** Contact information for a store location */
export interface LocationContact {
  phone: Maybe<string>
  whatsapp: Maybe<string>
  telephone: Maybe<string>
}

/** A physical store location or branch */
export interface StoreLocation {
  id: Id
  /** Branch / location name */
  name: LocalizedString
  /** Whether this location is active */
  isActive: boolean
  /** Default branch flag */
  isDefault: boolean
  /** Geographic coordinates */
  coordinates: Maybe<Coordinates>
  /** Short address summary */
  shortAddress: Maybe<string>
  /** Full street address */
  street: Maybe<string>
  /** Postal / ZIP code */
  postalCode: Maybe<string>
  /** City name */
  city: Maybe<LocalizedString>
  /** Region / state name */
  region: Maybe<LocalizedString>
  /** Country code */
  countryCode: Maybe<string>
  /** Contact info */
  contacts: Maybe<LocationContact>
  /** Weekly working hours */
  workingHours: WorkingHoursEntry[]
  /** Whether currently open */
  isOpen: boolean
  /** Supports in-store pickup */
  isPickupEnabled: boolean
  /** Supports shipping from this location */
  isShippingEnabled: boolean
  /** Supports cash-on-delivery */
  isCodAvailable: boolean
}
