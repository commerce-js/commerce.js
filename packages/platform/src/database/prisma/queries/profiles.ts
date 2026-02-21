// ---------------------------------------------------------------------------
// Prisma: Profile queries — cross-merchant buyer identity
// ---------------------------------------------------------------------------
// Prisma parity — mirrors drizzle/queries/profiles.ts
// Currently dormant (Prisma is inactive due to WASM edge issues)

import { getDb } from '../client.js'

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
  await getDb().profile.create({ data: { ...data, id } })
  return id
}

export async function findProfileById(id: string) {
  return getDb().profile.findUnique({ where: { id } })
}

export async function findProfileByEmail(email: string) {
  return getDb().profile.findUnique({ where: { email } })
}

export async function findProfileByPhone(phone: string) {
  return getDb().profile.findUnique({ where: { phone } })
}

export async function updateProfile(id: string, data: Record<string, any>) {
  await getDb().profile.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
}

export async function deleteProfile(id: string) {
  await getDb().profile.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// Profile Addresses
// ---------------------------------------------------------------------------

export async function findProfileAddresses(profileId: string) {
  return getDb().profileAddress.findMany({ where: { profileId } })
}

export async function findProfileAddressById(id: string) {
  return getDb().profileAddress.findUnique({ where: { id } })
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
  await getDb().profileAddress.create({ data: { ...data, id } })
  return id
}

export async function updateProfileAddress(id: string, data: Record<string, any>) {
  await getDb().profileAddress.update({ where: { id }, data })
}

export async function deleteProfileAddress(id: string) {
  await getDb().profileAddress.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// Profile Payment Methods
// ---------------------------------------------------------------------------

export async function findProfilePaymentMethods(profileId: string) {
  return getDb().profilePaymentMethod.findMany({ where: { profileId } })
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
  await getDb().profilePaymentMethod.create({ data: { ...data, id } })
  return id
}

export async function deleteProfilePaymentMethod(id: string) {
  await getDb().profilePaymentMethod.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// Profile Merchant Links
// ---------------------------------------------------------------------------

export async function findProfileMerchantLinks(profileId: string) {
  return getDb().profileMerchantLink.findMany({ where: { profileId } })
}

export async function upsertProfileMerchantLink(data: {
  profileId: string
  merchantId: string
  adapterCustomerId?: string | null
}) {
  await getDb().profileMerchantLink.upsert({
    where: {
      profileId_merchantId: {
        profileId: data.profileId,
        merchantId: data.merchantId,
      },
    },
    create: data,
    update: { adapterCustomerId: data.adapterCustomerId ?? null },
  })
}
