// ---------------------------------------------------------------------------
// POST /api/profile/otp/verify — Validate an OTP code
// ---------------------------------------------------------------------------
// Body: { profileId: string, code: string }
// Returns: { verified: boolean, profile?: Profile, error?: string }
// ---------------------------------------------------------------------------

import { ensureDb } from '../../../utils/db'
import { verifyOtp } from '../../../utils/otp'
import { createProfileDomain } from '@commercejs/platform'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.profileId || !body?.code) {
    throw createError({ statusCode: 400, message: 'profileId and code are required' })
  }

  ensureDb()

  const result = await verifyOtp(body.profileId, body.code)

  if (!result.valid) {
    return {
      verified: false,
      error: result.error,
    }
  }

  // OTP valid — return full profile with addresses + payment methods
  const profileDomain = createProfileDomain()
  const profile = await profileDomain.getProfile(body.profileId)

  return {
    verified: true,
    profile,
  }
})
