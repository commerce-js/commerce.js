// ---------------------------------------------------------------------------
// POST /api/profile/otp/send — Generate and send an OTP code
// ---------------------------------------------------------------------------
// Body: { profileId: string, channel?: 'email' | 'sms' }
// Returns: { sent: boolean, channel: string }
// ---------------------------------------------------------------------------

import { findProfileById } from '@commercejs/platform'
import { ensureDb } from '../../../utils/db'
import { generateOtp, sendOtp } from '../../../utils/otp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.profileId) {
    throw createError({ statusCode: 400, message: 'profileId is required' })
  }

  ensureDb()

  const channel = body.channel === 'sms' ? 'sms' : 'email' as const
  const profile = await findProfileById(body.profileId)

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  // Determine recipient
  const recipient = channel === 'sms' ? profile.phone : profile.email
  if (!recipient) {
    throw createError({
      statusCode: 400,
      message: `Profile has no ${channel === 'sms' ? 'phone number' : 'email address'}`,
    })
  }

  // Generate OTP
  const { code, rateLimited } = await generateOtp(profile.id, channel)

  if (rateLimited) {
    return {
      sent: true,
      channel,
      message: 'A code was already sent recently. Please check your inbox.',
    }
  }

  // Send OTP
  await sendOtp(channel, recipient, code)

  return {
    sent: true,
    channel,
  }
})
