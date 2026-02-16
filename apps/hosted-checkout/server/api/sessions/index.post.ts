// ---------------------------------------------------------------------------
// POST /api/sessions — Create a new checkout session
// ---------------------------------------------------------------------------
// Body: { merchantId?, amount, currency, returnUrl?, orderId?, customerInfo? }
// Returns: { sessionId, tapPublicKey, ...CheckoutSnapshot }
// ---------------------------------------------------------------------------

import { CheckoutSession } from '@commercejs/checkout'
import { useTapProviderForMerchant, useTapProviderFromEnv } from '../../utils/tap'

// In-memory session store (replace with Redis/KV in production)
const sessions = new Map<string, CheckoutSession>()

// Store per-session metadata (merchantId, publicKey) that isn't in CheckoutSession
const sessionMeta = new Map<string, { merchantId?: string, tapPublicKey: string }>()

let nextId = 1

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.amount || !body?.currency) {
    throw createError({ statusCode: 400, message: 'amount and currency are required' })
  }

  // Resolve Tap provider: per-merchant or env-level fallback
  let provider, publicKey: string

  if (body.merchantId) {
    try {
      const result = await useTapProviderForMerchant(body.merchantId)
      provider = result.provider
      publicKey = result.publicKey
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Merchant payment config not found'
      throw createError({ statusCode: 422, message })
    }
  }
  else {
    // Dev/testing fallback — uses env-level keys
    const result = useTapProviderFromEnv()
    provider = result.provider
    publicKey = result.publicKey
  }

  const sessionId = `cs_${Date.now()}_${nextId++}`
  const appUrl = useRuntimeConfig().public.appUrl

  const session = new CheckoutSession({
    paymentProvider: provider,
    amount: body.amount,
    currency: body.currency,
    returnUrl: body.returnUrl || `${appUrl}/${sessionId}/confirm`,
    cancelUrl: body.cancelUrl || `${appUrl}/${sessionId}?cancelled=true`,
    webhookUrl: `${appUrl}/api/webhooks/tap-payment`,
    orderId: body.orderId,
  })

  // If customer info is provided upfront, set it
  if (body.customerInfo?.email) {
    session.setCustomerInfo(body.customerInfo)
  }

  sessions.set(sessionId, session)
  sessionMeta.set(sessionId, {
    merchantId: body.merchantId,
    tapPublicKey: publicKey,
  })

  return {
    sessionId,
    tapPublicKey: publicKey,
    ...session.toSnapshot(),
  }
})

// Export the sessions and meta maps so other routes can access them
export { sessions, sessionMeta }
