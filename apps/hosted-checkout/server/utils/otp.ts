// ---------------------------------------------------------------------------
// OTP service — generate, send, and verify one-time passcodes
// ---------------------------------------------------------------------------

import {
  createOtpCode,
  findActiveOtpCode,
  markOtpVerified,
  incrementOtpAttempts,
  deleteExpiredOtpCodes,
} from '@commercejs/platform'

const OTP_TTL_MINUTES = 5
const MAX_ATTEMPTS = 5

/**
 * Generate a 6-digit OTP code for a profile.
 * Cleans up expired codes before generating a new one.
 */
export async function generateOtp(profileId: string, channel: 'email' | 'sms' = 'email') {
  // Clean up any expired or verified codes
  await deleteExpiredOtpCodes(profileId)

  // Check for an existing active code (rate limit — don't spam codes)
  const existing = await findActiveOtpCode(profileId)
  if (existing) {
    // If code was created less than 60s ago, don't regenerate
    const createdAt = existing.createdAt instanceof Date ? existing.createdAt : new Date(existing.createdAt)
    const secondsAgo = (Date.now() - createdAt.getTime()) / 1000
    if (secondsAgo < 60) {
      return { id: existing.id, code: existing.code, rateLimited: true }
    }
    // Rate limit passed — delete the old code before creating new one
    await markOtpVerified(existing.id)
  }

  // Generate a random 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000))

  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
  const id = await createOtpCode({ profileId, code, channel, expiresAt })

  return { id, code, rateLimited: false }
}

/**
 * Verify an OTP code.
 * Returns true if valid, false if invalid/expired/too many attempts.
 */
export async function verifyOtp(profileId: string, code: string): Promise<{ valid: boolean; error?: string }> {
  const otp = await findActiveOtpCode(profileId)

  if (!otp) {
    return { valid: false, error: 'No active verification code. Please request a new one.' }
  }

  // Check expiry
  const expiresAt = otp.expiresAt instanceof Date ? otp.expiresAt : new Date(otp.expiresAt)
  if (expiresAt <= new Date()) {
    return { valid: false, error: 'Verification code has expired. Please request a new one.' }
  }

  // Check max attempts
  if (otp.attempts >= MAX_ATTEMPTS) {
    return { valid: false, error: 'Too many attempts. Please request a new code.' }
  }

  // Compare codes
  if (otp.code !== code) {
    await incrementOtpAttempts(otp.id)
    const remaining = MAX_ATTEMPTS - otp.attempts - 1
    return { valid: false, error: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` }
  }

  // Mark as verified
  await markOtpVerified(otp.id)
  return { valid: true }
}

/**
 * Send OTP via the appropriate channel.
 * In dev mode, logs to console. In production, uses notification provider.
 */
export async function sendOtp(
  channel: 'email' | 'sms',
  recipient: string,
  code: string,
): Promise<void> {
  // Dev mode: log to console
  if (process.dev || process.env.NODE_ENV === 'development') {
    console.log(`[OTP] ${channel.toUpperCase()} code for ${recipient}: ${code}`)
    return
  }

  // Production: use notification provider
  // TODO: Wire up NotificationProvider once configured in hosted-checkout
  // For now, log a warning and still log the code (safe for staging)
  console.warn(`[OTP] Notification provider not configured — code for ${recipient}: ${code}`)
}
