// ---------------------------------------------------------------------------
// Customer domain types
// ---------------------------------------------------------------------------

import type { Id, Maybe, DeepPartial } from './common.js'

/** Physical address — includes GCC-specific fields */
export interface Address {
  id: Id
  firstName: string
  lastName: string
  phone: Maybe<string>
  street: string
  /** Additional street line (apartment, floor, etc.) */
  street2: Maybe<string>
  city: string
  state: Maybe<string>
  country: string
  postalCode: Maybe<string>
  /** حي — neighborhood/district (common in Saudi addresses) */
  district: Maybe<string>
  /** العنوان الوطني — Saudi National Address */
  nationalAddress: Maybe<string>
  /** الرقم الإضافي — Saudi additional number */
  additionalNumber: Maybe<string>
  isDefault: boolean
}

/** Customer entity */
export interface Customer {
  id: Id
  email: string
  firstName: Maybe<string>
  lastName: Maybe<string>
  phone: Maybe<string>
  addresses: Address[]
  defaultAddressId: Maybe<Id>
  createdAt: string
  updatedAt: string
}

/** Input for customer registration */
export interface RegisterInput {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}

/**
 * Input for updating customer profile.
 * Uses DeepPartial to allow nested partial updates (e.g., updating a single address field).
 */
export type UpdateCustomerInput = DeepPartial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>
