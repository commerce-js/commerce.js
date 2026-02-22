// ---------------------------------------------------------------------------
// GET /api/profile/cards — List saved cards for a profile
// ---------------------------------------------------------------------------
// Query: { profileId: string }
// Returns: { cards: TapSavedCard[] }
// ---------------------------------------------------------------------------

import { ensureDb } from '../../utils/db'
import { createProfileDomain } from '@commercejs/platform'
import { TapPaymentProvider } from '@commercejs/payment-tap'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const profileId = query.profileId as string

  if (!profileId) {
    throw createError({ statusCode: 400, message: 'profileId is required' })
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
    return { cards: [] }
  }

  // List saved cards from Tap
  const config = useRuntimeConfig()
  const provider = new TapPaymentProvider({
    secretKey: config.tapSecretKey,
  })

  try {
    const cards = await provider.listSavedCards(tapCustomerId)
    return { cards }
  }
  catch (err) {
    console.warn('[profile/cards] Failed to list saved cards:', err)
    return { cards: [] }
  }
})
