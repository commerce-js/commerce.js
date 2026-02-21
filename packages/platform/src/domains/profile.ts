// ---------------------------------------------------------------------------
// Profile domain — cross-merchant buyer identity
// ---------------------------------------------------------------------------

import type { Profile, SavedAddress, SavedPaymentMethod } from '@commercejs/types'
import {
  createProfile as dbCreateProfile,
  findProfileById,
  findProfileByEmail,
  findProfileByPhone,
  updateProfile as dbUpdateProfile,
  deleteProfile as dbDeleteProfile,
  findProfileAddresses,
  createProfileAddress as dbCreateProfileAddress,
  updateProfileAddress as dbUpdateProfileAddress,
  deleteProfileAddress as dbDeleteProfileAddress,
  findProfilePaymentMethods,
  createProfilePaymentMethod as dbCreateProfilePaymentMethod,
  deleteProfilePaymentMethod as dbDeleteProfilePaymentMethod,
  findProfileMerchantLinks,
  upsertProfileMerchantLink as dbUpsertProfileMerchantLink,
} from '../database/index.js'

/**
 * Build a full Profile object from a database row + related data.
 * Payment method `providerToken` is explicitly stripped — never exposed.
 */
function buildProfile(
  row: any,
  addresses: any[],
  paymentMethods: any[],
): Profile {
  return {
    id: row.id,
    email: row.email ?? null,
    phone: row.phone ?? null,
    firstName: row.firstName ?? null,
    lastName: row.lastName ?? null,
    preferences: row.preferences ?? null,
    addresses: addresses.map(buildSavedAddress),
    paymentMethods: paymentMethods.map(buildSavedPaymentMethod),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  }
}

function buildSavedAddress(row: any): SavedAddress {
  return {
    id: row.id,
    label: row.label ?? null,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone ?? null,
    street: row.street,
    street2: row.street2 ?? null,
    city: row.city,
    state: row.state ?? null,
    country: row.country,
    postalCode: row.postalCode ?? null,
    district: row.district ?? null,
    nationalAddress: row.nationalAddress ?? null,
    additionalNumber: row.additionalNumber ?? null,
    lastUsedAt: row.lastUsedAt instanceof Date ? row.lastUsedAt.toISOString() : row.lastUsedAt ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  }
}

function buildSavedPaymentMethod(row: any): SavedPaymentMethod {
  return {
    id: row.id,
    provider: row.provider,
    type: row.type,
    last4: row.last4,
    brand: row.brand ?? null,
    expiryMonth: row.expiryMonth ?? null,
    expiryYear: row.expiryYear ?? null,
    billingAddress: row.billingAddress ?? null,
    lastUsedAt: row.lastUsedAt instanceof Date ? row.lastUsedAt.toISOString() : row.lastUsedAt ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    // NOTE: providerToken is deliberately excluded — never returned to client
  }
}

export function createProfileDomain() {
  return {
    // ----- Lookup -----

    async lookupByEmail(email: string): Promise<Profile | null> {
      const row = await findProfileByEmail(email)
      if (!row) return null
      const addresses = await findProfileAddresses(row.id)
      const methods = await findProfilePaymentMethods(row.id)
      return buildProfile(row, addresses, methods)
    },

    async lookupByPhone(phone: string): Promise<Profile | null> {
      const row = await findProfileByPhone(phone)
      if (!row) return null
      const addresses = await findProfileAddresses(row.id)
      const methods = await findProfilePaymentMethods(row.id)
      return buildProfile(row, addresses, methods)
    },

    async getProfile(id: string): Promise<Profile | null> {
      const row = await findProfileById(id)
      if (!row) return null
      const addresses = await findProfileAddresses(row.id)
      const methods = await findProfilePaymentMethods(row.id)
      return buildProfile(row, addresses, methods)
    },

    // ----- Profile CRUD -----

    async createProfile(data: {
      email?: string | null
      phone?: string | null
      firstName?: string | null
      lastName?: string | null
      preferences?: Record<string, any> | null
    }): Promise<Profile> {
      const id = await dbCreateProfile(data)
      const profile = await this.getProfile(id)
      if (!profile) throw new Error(`Profile not found after creation: ${id}`)
      return profile
    },

    async updateProfile(id: string, data: {
      email?: string | null
      phone?: string | null
      firstName?: string | null
      lastName?: string | null
      preferences?: Record<string, any> | null
    }): Promise<Profile> {
      await dbUpdateProfile(id, data)
      const profile = await this.getProfile(id)
      if (!profile) throw new Error(`Profile not found after update: ${id}`)
      return profile
    },

    async deleteProfile(id: string): Promise<void> {
      await dbDeleteProfile(id)
    },

    // ----- Addresses -----

    async addAddress(profileId: string, data: {
      label?: string | null
      firstName: string
      lastName: string
      phone?: string | null
      street: string
      street2?: string | null
      city: string
      state?: string | null
      country: string
      postalCode?: string | null
      district?: string | null
      nationalAddress?: string | null
      additionalNumber?: string | null
    }): Promise<string> {
      return dbCreateProfileAddress({ ...data, profileId })
    },

    async updateAddress(addressId: string, data: Record<string, any>): Promise<void> {
      await dbUpdateProfileAddress(addressId, data)
    },

    async removeAddress(addressId: string): Promise<void> {
      await dbDeleteProfileAddress(addressId)
    },

    // ----- Payment Methods -----

    async addPaymentMethod(profileId: string, data: {
      provider: string
      type: string
      last4: string
      brand?: string | null
      expiryMonth?: number | null
      expiryYear?: number | null
      providerToken?: string | null
      billingAddress?: Record<string, any> | null
    }): Promise<string> {
      return dbCreateProfilePaymentMethod({ ...data, profileId })
    },

    async removePaymentMethod(id: string): Promise<void> {
      await dbDeleteProfilePaymentMethod(id)
    },

    // ----- Merchant Links -----

    async linkMerchant(profileId: string, merchantId: string, adapterCustomerId?: string | null): Promise<void> {
      await dbUpsertProfileMerchantLink({ profileId, merchantId, adapterCustomerId })
    },

    async getMerchantLinks(profileId: string) {
      return findProfileMerchantLinks(profileId)
    },
  }
}
