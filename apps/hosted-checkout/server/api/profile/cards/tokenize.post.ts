// ---------------------------------------------------------------------------
// POST /api/profile/cards/tokenize — Tokenize a saved card for payment
// ---------------------------------------------------------------------------
// Body: { profileId: string, cardId: string }
// Returns: { token: string }
// ---------------------------------------------------------------------------

import { ensureDb } from '../../../utils/db'
import { createProfileDomain } from '@commercejs/platform'
import { TapPaymentProvider } from '@commercejs/payment-tap'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { profileId, cardId } = body

  if (!profileId || !cardId) {
    throw createError({ statusCode: 400, message: 'profileId and cardId are required' })
  }

  ensureDb()

  const profileDomain = createProfileDomain()
  const profile = await profileDomain.getProfile(profileId)

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  // Get the Tap customer ID from the profile preferences
  const tapCustomerId = (profile as any).preferences?.paymentProviders?.tap?.customerId
  if (!tapCustomerId) {
    throw createError({ statusCode: 400, message: 'No saved payment method found' })
  }

  // Create a token from the saved card
  const config = useRuntimeConfig()
  const provider = new TapPaymentProvider({
    secretKey: config.tapSecretKey,
  })

  try {
    const token = await provider.createTokenFromSavedCard(tapCustomerId, cardId)
    return { token }
  }
  catch (err: any) {
    console.error('[tokenize] Failed to tokenize saved card:', err)
    throw createError({ statusCode: 500, message: 'Failed to tokenize saved card' })
  }
})
