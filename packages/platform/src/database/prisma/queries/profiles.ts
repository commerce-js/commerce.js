// ---------------------------------------------------------------------------
// Prisma: Profile queries — cross-merchant buyer identity
// ---------------------------------------------------------------------------
// Mirrors drizzle/queries/profiles.ts. Active driver on the fly/eaas branch
// once src/database/index.ts swaps the barrel (Step 3).

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
  // `phone` is not unique in the schema (Drizzle parity), so use findFirst.
  return getDb().profile.findFirst({ where: { phone } })
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
  await getDb().profileOtpCode.create({
    data: {
      id,
      profileId: data.profileId,
      code: data.code,
      channel: data.channel ?? 'email',
      expiresAt: data.expiresAt,
    },
  })
  return id
}

export async function findActiveOtpCode(profileId: string) {
  const now = new Date()
  const rows = await getDb().profileOtpCode.findMany({
    where: {
      profileId,
      verified: false,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  })
  return rows[0] ?? null
}

export async function markOtpVerified(id: string) {
  await getDb().profileOtpCode.update({
    where: { id },
    data: { verified: true },
  })
}

export async function incrementOtpAttempts(id: string) {
  await getDb().profileOtpCode.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  })
}

export async function deleteExpiredOtpCodes(profileId: string) {
  const now = new Date()
  // Delete everything that is expired OR already verified.
  await getDb().profileOtpCode.deleteMany({
    where: {
      profileId,
      OR: [
        { expiresAt: { lte: now } },
        { verified: true },
      ],
    },
  })
}
