// ---------------------------------------------------------------------------
// POST /api/webhooks/tap-payment — Tap payment event webhook
// ---------------------------------------------------------------------------
// Safety net for the sync-on-return pattern. Handles async payment events
// (CAPTURED, FAILED, REFUNDED, etc.) from Tap and updates sessions.
//
// Uses @xyz/webhook-verifier with the built-in Tap formatter/config
// for hashstring verification.
// ---------------------------------------------------------------------------

import { WebhookVerifier } from '@commercejs/webhook-verifier'
import { tap as tapConfig } from '@commercejs/webhook-verifier/configs'
import { getMerchantConfig } from '../../utils/merchant-store'
import { sessions, sessionMeta } from '../sessions/index.post'

export default defineEventHandler(async (event) => {
  // Read the raw body for signature verification
  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Empty webhook body' })
  }

  const body = JSON.parse(rawBody)
  const chargeId = body.id as string
  const chargeStatus = body.status as string

  console.log(`[tap-webhook] Received event for charge ${chargeId}: ${chargeStatus}`)

  // Find the matching session by charge ID
  let matchedSessionId: string | undefined
  for (const [sessionId, session] of sessions.entries()) {
    const snapshot = session.toSnapshot()
    if (snapshot.paymentSession?.id === chargeId) {
      matchedSessionId = sessionId
      break
    }
  }

  // Resolve the merchant's secret key for verification
  const meta = matchedSessionId ? sessionMeta.get(matchedSessionId) : undefined
  let secretKey: string

  if (meta?.merchantId) {
    try {
      const config = await getMerchantConfig(meta.merchantId)
      secretKey = config.tapSecretKey
    }
    catch {
      // Fall back to env-level key
      secretKey = useRuntimeConfig().tapSecretKey
    }
  }
  else {
    secretKey = useRuntimeConfig().tapSecretKey
  }

  // Verify the webhook using @xyz/webhook-verifier
  if (secretKey) {
    const verifier = new WebhookVerifier({
      ...tapConfig,
      secretKey,
    })

    const headers = getHeaders(event)
    const result = verifier.verify(body, headers)

    if (!result.isValid) {
      console.error(`[tap-webhook] Verification failed: ${result.error}`)
      throw createError({ statusCode: 401, message: 'Invalid webhook signature' })
    }

    console.log(`[tap-webhook] Hashstring verified for charge ${chargeId}`)
  }
  else {
    console.warn(`[tap-webhook] No secret key available — skipping verification`)
  }

  // Update the session if we found a match
  if (matchedSessionId) {
    const session = sessions.get(matchedSessionId)!
    const snapshot = session.toSnapshot()

    // Map Tap charge status to PaymentSessionStatus
    const statusMap: Record<string, string> = {
      CAPTURED: 'captured',
      INITIATED: 'pending',
      IN_PROGRESS: 'processing',
      ABANDONED: 'cancelled',
      CANCELLED: 'cancelled',
      FAILED: 'failed',
      DECLINED: 'failed',
      RESTRICTED: 'failed',
      TIMEDOUT: 'failed',
      VOID: 'cancelled',
    }

    const mappedStatus = statusMap[chargeStatus] || 'pending'

    // Build a PaymentSession from the webhook body
    const paymentSession = {
      id: chargeId,
      providerId: 'tap',
      status: mappedStatus as any,
      amount: body.amount ?? snapshot.amount,
      currency: body.currency ?? snapshot.currency,
      providerData: {
        tapChargeId: chargeId,
        tapStatus: chargeStatus,
        source: body.source,
        reference: body.reference,
        gateway: body.gateway,
      },
      redirectUrl: null,
      createdAt: body.created ?? new Date().toISOString(),
    }

    session.handleWebhookUpdate(paymentSession)
    console.log(`[tap-webhook] Session ${matchedSessionId} updated: ${snapshot.state} → ${session.toSnapshot().state}`)
  }
  else {
    console.warn(`[tap-webhook] No session found for charge ${chargeId}`)
  }

  // Always return 200 to Tap
  return { received: true, chargeId, status: chargeStatus }
})
