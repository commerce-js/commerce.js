// ---------------------------------------------------------------------------
// POST /api/webhooks/tap-payment — Tap payment event webhook
// ---------------------------------------------------------------------------
// Safety net for the 3DS redirect pattern. If the user's browser redirect
// fails after payment capture, this webhook ensures the order still gets
// placed and its status updated.
//
// Tap sends the full charge object. We use `reference.order` (= cartId)
// to identify the cart, then idempotently place the order.
// ---------------------------------------------------------------------------

import { createCheckoutDomain, createOrdersDomain, createCartDomain } from '@commercejs/platform'
import { WebhookVerifier } from '@commercejs/webhook-verifier'
import { tap as tapConfig } from '@commercejs/webhook-verifier/configs'
import { ensureDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Empty webhook body' })
  }

  const body = JSON.parse(rawBody)
  const chargeId = body.id as string
  const chargeStatus = (body.status as string)?.toUpperCase()
  const cartId = body.reference?.order as string | undefined

  console.log(`[tap-webhook] Received: charge=${chargeId} status=${chargeStatus} cartId=${cartId}`)

  // Verify webhook signature (may not be available on Cloudflare Workers)
  const secretKey = useRuntimeConfig().tapSecretKey
  if (secretKey) {
    try {
      const verifier = new WebhookVerifier({ ...tapConfig, secretKey })
      const headers = getHeaders(event)
      const result = verifier.verify(body, headers)

      if (!result.isValid) {
        console.error(`[tap-webhook] Verification failed: ${result.error}`)
        throw createError({ statusCode: 401, message: 'Invalid webhook signature' })
      }
      console.log(`[tap-webhook] Signature verified for charge ${chargeId}`)
    }
    catch (err: any) {
      // crypto.createHmac not available in Cloudflare Workers
      if (err.message?.includes('not implemented') || err.message?.includes('createHmac')) {
        console.warn(`[tap-webhook] Skipping verification (crypto not available in Workers runtime)`)
      }
      else {
        throw err
      }
    }
  }
  else {
    console.warn(`[tap-webhook] No TAP_SECRET_KEY — skipping signature verification`)
  }

  // Only act on CAPTURED charges
  if (chargeStatus !== 'CAPTURED') {
    console.log(`[tap-webhook] Ignoring non-captured status: ${chargeStatus}`)
    return { received: true, chargeId, status: chargeStatus, action: 'ignored' }
  }

  if (!cartId) {
    console.warn(`[tap-webhook] No cartId in reference.order — cannot place order`)
    return { received: true, chargeId, status: chargeStatus, action: 'no_cart_id' }
  }

  ensureDb()
  const config = useRuntimeConfig()
  const currency = config.commerceCurrency || 'BHD'

  const cartDomain = createCartDomain(currency)
  const checkoutDomain = createCheckoutDomain(currency)
  const ordersDomain = createOrdersDomain(currency)

  // Check if cart still exists — if not, the redirect already placed the order
  try {
    await cartDomain.getCart(cartId)
  }
  catch {
    // Cart already deleted = order was already placed by the redirect handler
    console.log(`[tap-webhook] Cart ${cartId} not found — order already placed via redirect`)
    return { received: true, chargeId, status: chargeStatus, action: 'already_placed' }
  }

  // Cart still exists — the redirect handler didn't fire. Place the order now.
  try {
    const order = await checkoutDomain.placeOrder(cartId)

    await ordersDomain.updateOrderStatus(order.id, {
      status: 'processing',
      note: `Card payment captured via webhook (Tap charge: ${chargeId})`,
    })

    console.log(`[tap-webhook] Order ${order.id} placed from webhook for cart ${cartId}`)
    return { received: true, chargeId, status: chargeStatus, action: 'order_placed', orderId: order.id }
  }
  catch (err: any) {
    // Race condition: redirect handler deleted the cart between our check and placeOrder
    if (err.message?.includes('Cart not found')) {
      console.log(`[tap-webhook] Cart ${cartId} disappeared (race with redirect) — order already placed`)
      return { received: true, chargeId, status: chargeStatus, action: 'already_placed' }
    }
    console.error(`[tap-webhook] Failed to place order for cart ${cartId}:`, err.message)
    // Still return 200 to Tap so it doesn't retry indefinitely
    return { received: true, chargeId, status: chargeStatus, action: 'error', error: err.message }
  }
})
