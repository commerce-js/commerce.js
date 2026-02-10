// ---------------------------------------------------------------------------
// POST /api/webhooks/tap-connect — Tap Connect onboarding webhook
// ---------------------------------------------------------------------------
// Called by Tap when a merchant completes the Tap Connect onboarding wizard.
// Receives merchant credentials and saves them to the merchant store.
//
// The webhook URL is registered during the Lead creation process in Tap's
// Connect API. After the merchant finishes onboarding, Tap POSTs here.
// ---------------------------------------------------------------------------

import { saveMerchantConfig } from '../../utils/merchant-store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Tap Connect webhook payload varies — extract what we need
  // Common fields: merchant_id, api_key (secret), publishable_key, status
  if (!body) {
    throw createError({ statusCode: 400, message: 'Empty webhook payload' })
  }

  // TODO: Verify webhook signature in production
  // const signature = getHeader(event, 'tap-signature')
  // await verifyTapConnectSignature(body, signature)

  // Extract merchant credentials from the webhook payload
  // Tap Connect sends different structures depending on the event type
  const merchantId = body.merchant_id || body.destination?.id || body.id
  const secretKey = body.api_key || body.secret_key || body.live_keys?.secret
  const publicKey = body.publishable_key || body.public_key || body.live_keys?.publishable

  if (!merchantId) {
    throw createError({ statusCode: 400, message: 'Missing merchant_id in webhook payload' })
  }

  if (!secretKey || !publicKey) {
    // This might be a status update webhook, not the credentials webhook
    console.log(`[tap-connect] Received webhook for merchant ${merchantId} without credentials — possibly a status update`)
    return { received: true, merchantId, action: 'no_credentials' }
  }

  // Save to merchant store
  const config = await saveMerchantConfig({
    merchantId,
    tapSecretKey: secretKey,
    tapPublicKey: publicKey,
    tapMerchantId: body.destination?.id || merchantId,
    onboardingMethod: 'tap_connect',
    status: 'active',
  })

  console.log(`[tap-connect] Merchant ${merchantId} onboarded via Tap Connect`)

  return {
    received: true,
    merchantId: config.merchantId,
    status: config.status,
  }
})
