// ---------------------------------------------------------------------------
// POST /api/profile — Save or update a profile after checkout
// ---------------------------------------------------------------------------
// Body: { profileId: string, firstName?, lastName?, address?, paymentMethod? }
// Returns: { profile: Profile }
// ---------------------------------------------------------------------------

import { createProfileDomain } from '@commercejs/platform'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.profileId) {
    throw createError({ statusCode: 400, message: 'profileId is required' })
  }

  const profileDomain = createProfileDomain()

  // Check profile exists
  const existing = await profileDomain.getProfile(body.profileId)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  // Update profile fields if provided
  const updates: Record<string, any> = {}
  if (body.firstName !== undefined) updates.firstName = body.firstName
  if (body.lastName !== undefined) updates.lastName = body.lastName
  if (body.phone !== undefined) updates.phone = body.phone

  // Store payment provider customer IDs in preferences (JSONB)
  if (body.tapCustomerId) {
    const currentPrefs = (existing as any).preferences || {}
    updates.preferences = {
      ...currentPrefs,
      paymentProviders: {
        ...(currentPrefs.paymentProviders || {}),
        tap: {
          ...(currentPrefs.paymentProviders?.tap || {}),
          customerId: body.tapCustomerId,
        },
      },
    }
  }

  if (Object.keys(updates).length > 0) {
    await profileDomain.updateProfile(body.profileId, updates)
  }

  // Save new address if provided
  if (body.address) {
    await profileDomain.addAddress(body.profileId, {
      label: body.address.label ?? null,
      firstName: body.address.firstName,
      lastName: body.address.lastName,
      phone: body.address.phone ?? null,
      street: body.address.street,
      street2: body.address.street2 ?? null,
      city: body.address.city,
      state: body.address.state ?? null,
      country: body.address.country,
      postalCode: body.address.postalCode ?? null,
      district: body.address.district ?? null,
      nationalAddress: body.address.nationalAddress ?? null,
      additionalNumber: body.address.additionalNumber ?? null,
    })
  }

  // Save payment method if provided
  if (body.paymentMethod) {
    await profileDomain.addPaymentMethod(body.profileId, {
      provider: body.paymentMethod.provider,
      type: body.paymentMethod.type,
      last4: body.paymentMethod.last4,
      brand: body.paymentMethod.brand ?? null,
      expiryMonth: body.paymentMethod.expiryMonth ?? null,
      expiryYear: body.paymentMethod.expiryYear ?? null,
      providerToken: body.paymentMethod.providerToken ?? null,
      billingAddress: body.paymentMethod.billingAddress ?? null,
    })
  }

  // Return updated profile
  const profile = await profileDomain.getProfile(body.profileId)
  return { profile }
})
