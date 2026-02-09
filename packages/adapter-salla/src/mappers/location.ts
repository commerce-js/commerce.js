// ---------------------------------------------------------------------------
// Salla → StoreLocation (branch) mapper
// ---------------------------------------------------------------------------

import type { StoreLocation, LocalizedString, WorkingHoursEntry } from '@commercejs/types'
import type { SallaRawBranch } from '../types.js'

function toLocalized(value: string | null, locale: string = 'ar'): LocalizedString {
  if (locale === 'en') return { ar: '', en: value ?? '' }
  return { ar: value ?? '', en: '' }
}

export function mapSallaBranch(raw: SallaRawBranch, locale: string = 'ar'): StoreLocation {
  const workingHours: WorkingHoursEntry[] = (raw.working_hours ?? []).map((wh) => ({
    day: wh.day,
    from: wh.from ?? null,
    to: wh.to ?? null,
    isClosed: wh.is_closed ?? (!wh.from && !wh.to),
  }))

  return {
    id: String(raw.id),
    name: toLocalized(raw.name, locale),
    isActive: raw.status === 'active',
    isDefault: raw.is_default,
    coordinates: raw.location
      ? { lat: parseFloat(raw.location.lat), lng: parseFloat(raw.location.lng) }
      : null,
    shortAddress: raw.short_address,
    street: raw.street,
    postalCode: raw.postal_code,
    city: raw.city ? { ar: raw.city.name, en: raw.city.name_en || raw.city.name } : null,
    region: raw.region ? toLocalized(raw.region.name, locale) : null,
    countryCode: raw.country?.code ?? null,
    contacts: raw.contacts
      ? {
          phone: raw.contacts.phone,
          whatsapp: raw.contacts.whatsapp,
          telephone: raw.contacts.telephone,
        }
      : null,
    workingHours,
    isOpen: raw.is_open,
    isPickupEnabled: raw.pickable,
    isShippingEnabled: raw.shippable,
    isCodAvailable: raw.is_cod_available,
  }
}
