// ---------------------------------------------------------------------------
// Salla → Customer mapper
// ---------------------------------------------------------------------------

import type { Customer, Address } from '@commercejs/types'
import type { SallaRawCustomer, SallaRawAddress } from '../types.js'

/** Extract date string from Salla's flexible date format */
function extractDate(date: string | { date: string } | undefined): string {
  if (!date) return new Date().toISOString()
  if (typeof date === 'string') return date
  return date.date
}

/** Map Salla raw customer → unified Customer */
export function mapSallaCustomer(raw: SallaRawCustomer): Customer {
  return {
    id: String(raw.id),
    firstName: raw.first_name,
    lastName: raw.last_name,
    email: raw.email,
    phone: raw.mobile ? `${raw.mobile_code}${raw.mobile}` : null,
    addresses: [],
    defaultAddressId: null,
    createdAt: extractDate(raw.created_at),
    updatedAt: extractDate(raw.updated_at),
  }
}

/** Map Salla raw address → unified Address */
export function mapSallaAddress(raw: SallaRawAddress): Address {
  return {
    id: String(raw.id),
    firstName: '',
    lastName: '',
    phone: null,
    street: [raw.street_number, raw.block].filter(Boolean).join(', ') || '',
    street2: null,
    city: raw.city ?? '',
    state: null,
    country: raw.country_code ?? raw.country ?? '',
    postalCode: raw.postal_code ?? null,
    district: null,
    nationalAddress: null,
    additionalNumber: null,
    isDefault: false,
  }
}
