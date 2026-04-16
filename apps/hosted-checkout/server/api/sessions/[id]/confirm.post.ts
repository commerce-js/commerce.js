// ---------------------------------------------------------------------------
// POST /api/sessions/[id]/confirm — Confirm payment after 3DS redirect
// ---------------------------------------------------------------------------
// Body: { chargeId? } — optional, uses stored session ID if not provided
// Returns: { sessionId, tapCustomerId?, savedCard?, ...snapshot }
// ---------------------------------------------------------------------------

import { sessions } from '../index.post'
import { createProfileDomain } from '@commercejs/platform'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !sessions.has(id)) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }

  const body = await readBody(event).catch(() => ({}))
  const session = sessions.get(id)!

  try {
    await session.confirmPayment(body?.chargeId)

    // Get the payment session for saved card data
    const paymentSession = session.paymentSession
    const tapCustomerId = (paymentSession?.providerData as any)?.tapCustomerId ?? null

    // Server-side: persist tapCustomerId to profile after successful capture
    // (Client state is lost after 3DS redirect, so we must save here)
    if (tapCustomerId && session.customerInfo?.email) {
      try {
        const profileDomain = createProfileDomain()
        const profile = await profileDomain.lookupByEmail(session.customerInfo.email)
        if (profile) {
          const currentPrefs = (profile as any).preferences || {}
          await profileDomain.updateProfile(profile.id, {
            preferences: {
              ...currentPrefs,
              paymentProviders: {
                ...(currentPrefs.paymentProviders || {}),
                tap: {
                  ...(currentPrefs.paymentProviders?.tap || {}),
                  customerId: tapCustomerId,
                },
              },
            },
          })
        }
      }
      catch {
        // Best-effort — don't fail the confirm response
      }
    }

    return {
      sessionId: id,
      tapCustomerId,
      savedCard: (paymentSession?.providerData as any)?.savedCard ?? null,
      ...session.toSnapshot(),
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Payment confirmation failed'
    // Return the snapshot even on error so the UI can show state
    return {
      sessionId: id,
      ...session.toSnapshot(),
      error: message,
    }
  }
})
