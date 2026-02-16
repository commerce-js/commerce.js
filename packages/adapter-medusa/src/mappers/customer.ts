// ---------------------------------------------------------------------------
// Customer mapper — MedusaCustomer → Commerce.js Customer
// ---------------------------------------------------------------------------

import type { Customer, Address } from '@commercejs/types'
import type { MedusaCustomer, MedusaCustomerAddress, MedusaAddress } from '../types.js'

/** Map a Medusa address (from cart or standalone) → Commerce.js Address */
export function mapMedusaAddress(a: MedusaAddress | MedusaCustomerAddress): Address {
  const isCustomerAddr = 'is_default_shipping' in a
  return {
    id: a.id ?? '',
    firstName: a.first_name ?? '',
    lastName: a.last_name ?? '',
    phone: a.phone ?? null,
    street: a.address_1 ?? '',
    street2: a.address_2 ?? null,
    city: a.city ?? '',
    state: a.province ?? null,
    country: a.country_code ?? '',
    postalCode: a.postal_code ?? null,
    district: null,
    nationalAddress: null,
    additionalNumber: null,
    isDefault: isCustomerAddr ? (a as MedusaCustomerAddress).is_default_shipping : false,
  }
}

/** Map MedusaCustomer → Commerce.js Customer */
export function mapMedusaCustomer(c: MedusaCustomer): Customer {
  const addresses = (c.addresses ?? []).map(a => mapMedusaAddress(a))
  const defaultAddr = (c.addresses ?? []).find(a => a.is_default_shipping)

  return {
    id: c.id,
    email: c.email,
    firstName: c.first_name ?? null,
    lastName: c.last_name ?? null,
    phone: c.phone ?? null,
    addresses,
    defaultAddressId: defaultAddr?.id ?? null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }
}
