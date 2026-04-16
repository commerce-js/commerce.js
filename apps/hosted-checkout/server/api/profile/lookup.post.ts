// ---------------------------------------------------------------------------
// POST /api/profile/lookup — Find a profile by email or phone
// ---------------------------------------------------------------------------
// Body: { email?: string, phone?: string }
// Returns: { exists: boolean, profileId?: string, verificationRequired: boolean }
// ---------------------------------------------------------------------------

import { findProfileByEmail, findProfileByPhone, createProfile } from '@commercejs/platform'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.email && !body?.phone) {
    throw createError({ statusCode: 400, message: 'email or phone is required' })
  }

  // Look up by email first, then phone
  let profile = null
  if (body.email) {
    profile = await findProfileByEmail(body.email)
  }
  if (!profile && body.phone) {
    profile = await findProfileByPhone(body.phone)
  }

  if (profile) {
    return {
      exists: true,
      profileId: profile.id,
      verificationRequired: true,
    }
  }

  // Profile doesn't exist — create a new one
  const id = await createProfile({
    email: body.email ?? null,
    phone: body.phone ?? null,
  })

  return {
    exists: false,
    profileId: id,
    verificationRequired: true,
  }
})
