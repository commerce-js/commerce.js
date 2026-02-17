// ---------------------------------------------------------------------------
// POST /api/payment-links — Create a payment link with QR code
// ---------------------------------------------------------------------------
// Body: { amount, currency, merchantId?, orderId?, channel?,
//         fulfillment?, expiresIn?, customerInfo? }
// Returns: { sessionId, url, qrDataUrl, expiresAt }
// ---------------------------------------------------------------------------

import { CheckoutSession } from '@commercejs/checkout'
import QRCode from 'qrcode'
import { sessions, sessionMeta } from '../sessions/index.post'

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
    const result = useTapProviderFromEnv()
    provider = result.provider
    publicKey = result.publicKey
  }

  // Generate session ID
  const sessionId = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const appUrl = useRuntimeConfig().public.appUrl

  // Default TTL: 30 minutes
  const expiresIn = body.expiresIn ?? 30 * 60 * 1000

  // Create checkout session — payment-only by default
  const session = new CheckoutSession({
    paymentProvider: provider,
    amount: body.amount,
    currency: body.currency,
    channel: body.channel ?? 'link',
    fulfillment: body.fulfillment ?? 'none',
    expiresIn,
    returnUrl: `${appUrl}/pay/${sessionId}/confirm`,
    cancelUrl: `${appUrl}/pay/${sessionId}?cancelled=true`,
    webhookUrl: `${appUrl}/api/webhooks/tap-payment`,
    orderId: body.orderId,
  })

  // If customer info is provided upfront, set it
  if (body.customerInfo?.email) {
    session.setCustomerInfo(body.customerInfo)
  }

  // Store session
  sessions.set(sessionId, session)
  sessionMeta.set(sessionId, {
    merchantId: body.merchantId,
    tapPublicKey: publicKey,
  })

  // Generate checkout URL + QR code
  const checkoutUrl = `${appUrl}/pay/${sessionId}`
  const qrDataUrl = await QRCode.toDataURL(checkoutUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })

  const snapshot = session.toSnapshot()

  return {
    sessionId,
    url: checkoutUrl,
    qrDataUrl,
    ...snapshot,
  }
})
