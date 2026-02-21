// ---------------------------------------------------------------------------
// Profile domain types — cross-merchant buyer identity
// ---------------------------------------------------------------------------
// Profile is a universal identity that spans all Commerce.js stores.
// It is NOT the same as Customer — Customer is merchant-scoped, Profile is
// network-scoped (across all stores using Commerce.js Cloud).
// ---------------------------------------------------------------------------

import type { Maybe } from './common.js'

/**
 * Cross-merchant buyer profile.
 *
 * A single Profile may be linked to multiple merchant Customers via
 * the `profile_merchant_links` table. Profiles are identified by email
 * or phone (E.164 normalized).
 */
export interface Profile {
  id: string
  /** Unique email — primary identifier for most buyers */
  email: Maybe<string>
  /** Unique phone in E.164 format (e.g., +966501234567) */
  phone: Maybe<string>
  firstName: Maybe<string>
  lastName: Maybe<string>
  /** Buyer preferences (locale, currency, etc.) */
  preferences: Maybe<Record<string, any>>
  /** Saved addresses (populated when profile is fully loaded) */
  addresses: SavedAddress[]
  /** Saved payment methods — display info only, never raw tokens */
  paymentMethods: SavedPaymentMethod[]
  createdAt: string
  updatedAt: string
}

/**
 * Profile-stored address with a user-defined label.
 *
 * Unlike the merchant-scoped `Address` type (which has `id` and `isDefault`),
 * SavedAddress uses `label` for user-friendly identification ('Home', 'Office').
 */
export interface SavedAddress {
  id: string
  /** User-defined label: 'Home', 'Office', 'Work', or custom */
  label: Maybe<string>
  firstName: string
  lastName: string
  phone: Maybe<string>
  street: string
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
  lastUsedAt: Maybe<string>
  createdAt: string
}

/**
 * Saved payment method — display-only info for the buyer's profile.
 *
 * The actual `providerToken` is stored in the database but NEVER exposed
 * through the API or this type. Charges are initiated server-side using
 * the stored token.
 */
export interface SavedPaymentMethod {
  id: string
  /** Payment gateway: 'tap', 'stripe', etc. */
  provider: string
  /** Payment method type: 'card', 'mada', 'apple_pay', etc. */
  type: string
  /** Last 4 digits of the card */
  last4: string
  /** Card brand: 'visa', 'mastercard', 'mada', 'amex', etc. */
  brand: Maybe<string>
  expiryMonth: Maybe<number>
  expiryYear: Maybe<number>
  /** Billing address associated with this payment method */
  billingAddress: Maybe<Omit<SavedAddress, 'id' | 'label' | 'lastUsedAt' | 'createdAt'>>
  lastUsedAt: Maybe<string>
  createdAt: string
}

/**
 * Link between a Profile and a merchant's Customer record.
 *
 * Enables cross-merchant identity: one buyer, many stores.
 */
export interface ProfileMerchantLink {
  profileId: string
  merchantId: string
  /** The merchant-scoped Customer.id from the adapter */
  adapterCustomerId: Maybe<string>
  createdAt: string
}
