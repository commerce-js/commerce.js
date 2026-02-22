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

// ---------------------------------------------------------------------------
// OTP Codes
// ---------------------------------------------------------------------------

export async function createOtpCode(data: {
  profileId: string
  code: string
  channel?: string
  expiresAt: Date
}) {
  const id = crypto.randomUUID()
  await getDb().insert(schema.profileOtpCodes).values({ ...data, id } as any)
  return id
}

export async function findActiveOtpCode(profileId: string) {
  const rows = await getDb().select().from(schema.profileOtpCodes)
    .where(
      and(
        eq(schema.profileOtpCodes.profileId, profileId),
        eq(schema.profileOtpCodes.verified, false),
      ),
    )
  // Return the most recent non-expired code (sort newest first)
  const now = new Date()
  const active = rows
    .filter(r => r.expiresAt > now)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return active[0] ?? null
}

export async function markOtpVerified(id: string) {
  await getDb().update(schema.profileOtpCodes)
    .set({ verified: true } as any)
    .where(eq(schema.profileOtpCodes.id, id))
}

export async function incrementOtpAttempts(id: string) {
  const row = await getDb().select().from(schema.profileOtpCodes)
    .where(eq(schema.profileOtpCodes.id, id))
  if (row[0]) {
    await getDb().update(schema.profileOtpCodes)
      .set({ attempts: row[0].attempts + 1 } as any)
      .where(eq(schema.profileOtpCodes.id, id))
  }
}

export async function deleteExpiredOtpCodes(profileId: string) {
  // Delete expired, verified, and all but the latest non-expired code
  const rows = await getDb().select().from(schema.profileOtpCodes)
    .where(eq(schema.profileOtpCodes.profileId, profileId))
  for (const row of rows) {
    // Delete expired or verified codes
    if (row.expiresAt <= new Date() || row.verified) {
      await getDb().delete(schema.profileOtpCodes)
        .where(eq(schema.profileOtpCodes.id, row.id))
    }
  }
}
