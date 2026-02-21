// ---------------------------------------------------------------------------
// Drizzle: Profile queries — cross-merchant buyer identity
// ---------------------------------------------------------------------------

import { eq, and } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function createProfile(data: {
  id?: string
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  preferences?: Record<string, any> | null
}) {
  const id = data.id ?? crypto.randomUUID()
  await getDb().insert(schema.profiles).values({ ...data, id } as any)
  return id
}

export async function findProfileById(id: string) {
  const [row] = await getDb().select().from(schema.profiles).where(eq(schema.profiles.id, id))
  return row ?? null
}

export async function findProfileByEmail(email: string) {
  const [row] = await getDb().select().from(schema.profiles).where(eq(schema.profiles.email, email))
  return row ?? null
}

export async function findProfileByPhone(phone: string) {
  const [row] = await getDb().select().from(schema.profiles).where(eq(schema.profiles.phone, phone))
  return row ?? null
}

export async function updateProfile(id: string, data: Record<string, any>) {
  await getDb().update(schema.profiles).set({ ...data, updatedAt: new Date() } as any).where(eq(schema.profiles.id, id))
}

export async function deleteProfile(id: string) {
  await getDb().delete(schema.profiles).where(eq(schema.profiles.id, id))
}

// ---------------------------------------------------------------------------
// Profile Addresses
// ---------------------------------------------------------------------------

export async function findProfileAddresses(profileId: string) {
  return getDb().select().from(schema.profileAddresses)
    .where(eq(schema.profileAddresses.profileId, profileId))
}

export async function findProfileAddressById(id: string) {
  const [row] = await getDb().select().from(schema.profileAddresses)
    .where(eq(schema.profileAddresses.id, id))
  return row ?? null
}

export async function createProfileAddress(data: {
  id?: string
  profileId: string
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
}) {
  const id = data.id ?? crypto.randomUUID()
  await getDb().insert(schema.profileAddresses).values({ ...data, id } as any)
  return id
}

export async function updateProfileAddress(id: string, data: Record<string, any>) {
  await getDb().update(schema.profileAddresses).set(data as any)
    .where(eq(schema.profileAddresses.id, id))
}

export async function deleteProfileAddress(id: string) {
  await getDb().delete(schema.profileAddresses)
    .where(eq(schema.profileAddresses.id, id))
}

// ---------------------------------------------------------------------------
// Profile Payment Methods
// ---------------------------------------------------------------------------

export async function findProfilePaymentMethods(profileId: string) {
  return getDb().select().from(schema.profilePaymentMethods)
    .where(eq(schema.profilePaymentMethods.profileId, profileId))
}

export async function createProfilePaymentMethod(data: {
  id?: string
  profileId: string
  provider: string
  type: string
  last4: string
  brand?: string | null
  expiryMonth?: number | null
  expiryYear?: number | null
  providerToken?: string | null
  billingAddress?: Record<string, any> | null
}) {
  const id = data.id ?? crypto.randomUUID()
  await getDb().insert(schema.profilePaymentMethods).values({ ...data, id } as any)
  return id
}

export async function deleteProfilePaymentMethod(id: string) {
  await getDb().delete(schema.profilePaymentMethods)
    .where(eq(schema.profilePaymentMethods.id, id))
}

// ---------------------------------------------------------------------------
// Profile Merchant Links
// ---------------------------------------------------------------------------

export async function findProfileMerchantLinks(profileId: string) {
  return getDb().select().from(schema.profileMerchantLinks)
    .where(eq(schema.profileMerchantLinks.profileId, profileId))
}

export async function upsertProfileMerchantLink(data: {
  profileId: string
  merchantId: string
  adapterCustomerId?: string | null
}) {
  await getDb().insert(schema.profileMerchantLinks)
    .values(data as any)
    .onConflictDoUpdate({
      target: [schema.profileMerchantLinks.profileId, schema.profileMerchantLinks.merchantId],
      set: { adapterCustomerId: data.adapterCustomerId ?? null } as any,
    })
}
