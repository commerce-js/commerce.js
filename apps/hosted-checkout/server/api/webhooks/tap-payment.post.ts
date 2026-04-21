// ---------------------------------------------------------------------------
// POST /api/webhooks/tap-payment — Tap payment event webhook
// ---------------------------------------------------------------------------
// Order-First flow: order already exists with status 'awaiting_payment'.
// This handler just verifies the signature, checks status, and updates
// the order. Fully idempotent — same operation as the redirect handler.
//
// Tap sends the full charge object. We use `reference.order` (= orderId)
// and `metadata.cartId` (= cartId) to identify resources.
// ---------------------------------------------------------------------------

import { createOrdersDomain, createCartDomain } from '@commercejs/platform'
import { WebhookVerifier } from '@commercejs/webhook-verifier'
import { tap as tapConfig } from '@commercejs/webhook-verifier/configs'

export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Empty webhook body' })
  }

  const body = JSON.parse(rawBody)
  const chargeId = body.id as string
  const chargeStatus = (body.status as string)?.toUpperCase()
  const orderId = body.reference?.order as string | undefined
  const cartId = body.metadata?.cartId as string | undefined
  // Buyer identity echoed from cart-pay's Tap `metadata`; used to enqueue
  // the order-confirmation email when this handler wins the race against
  // cart-confirm.get.ts. If either field is missing (older charges that
  // predate the metadata bump) we skip the email — logged below.
  const metadataMerchantId = body.metadata?.merchantId as string | undefined
  const metadataBuyerEmail = body.metadata?.buyerEmail as string | undefined
  const metadataBuyerName = body.metadata?.buyerName as string | undefined

  console.log(`[tap-webhook] Received: charge=${chargeId} status=${chargeStatus} orderId=${orderId}`)

  // Verify webhook signature
  const secretKey = useRuntimeConfig().tapSecretKey
  if (secretKey) {
    const verifier = new WebhookVerifier({ ...tapConfig, secretKey })
    const headers = getHeaders(event)
    const result = await verifier.verify(body, headers)

    if (!result.isValid) {
      console.error(`[tap-webhook] Verification failed: ${result.error}`)
      throw createError({ statusCode: 401, message: 'Invalid webhook signature' })
    }
    console.log(`[tap-webhook] Signature verified for charge ${chargeId}`)
  }
  else {
    console.warn(`[tap-webhook] No TAP_SECRET_KEY — skipping signature verification`)
  }

  // Only act on CAPTURED charges
  if (chargeStatus !== 'CAPTURED') {
    console.log(`[tap-webhook] Ignoring non-captured status: ${chargeStatus}`)
    return { received: true, chargeId, status: chargeStatus, action: 'ignored' }
  }

  if (!orderId) {
    console.warn(`[tap-webhook] No orderId in reference.order — cannot update`)
    return { received: true, chargeId, status: chargeStatus, action: 'no_order_id' }
  }

  const config = useRuntimeConfig()
  const currency = config.commerceCurrency || 'BHD'

  const ordersDomain = createOrdersDomain(currency)
  const cartDomain = createCartDomain(currency)

  try {
    // Check current order status — if already 'processing', this is a no-op
    const order = await ordersDomain.getOrder(orderId)

    if (order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') {
      console.log(`[tap-webhook] Order ${orderId} already ${order.status} — no-op`)
      return { received: true, chargeId, status: chargeStatus, action: 'already_processed', orderId }
    }

    // Update order status: awaiting_payment → processing
    await ordersDomain.updateOrderStatus(orderId, {
      status: 'processing',
      note: `Card payment captured via webhook (Tap charge: ${chargeId})`,
    })

    // Clean up the cart (may already be deleted by redirect — that's OK)
    if (cartId) {
      try { await cartDomain.deleteCart(cartId) } catch {}
    }

    // Fire the buyer-facing order-confirmation email. Reaching this branch
    // means this handler transitioned the order (the earlier idempotency
    // guard short-circuited if it was already `processing`), so enqueueing
    // here is the authoritative "payment captured" signal when the user's
    // redirect didn't make it back to cart-confirm.get.ts (closed tab,
    // mobile app-switch, etc.). Best-effort — never fail the webhook.
    if (metadataMerchantId && metadataBuyerEmail) {
      try {
        const merchantRow = event.context.merchant as { id: string, subdomain: string, name: string } | undefined
        const storeName = merchantRow?.name ?? 'your store'
        const subdomain = merchantRow?.subdomain ?? ''
        const orderStatusUrl = subdomain
          ? `https://${subdomain}.commercejs.cloud/order-confirmation?orderId=${orderId}`
          : `https://commercejs.cloud/order-confirmation?orderId=${orderId}`
        const { enqueueOrderConfirmationEmail } = await import('../../utils/orderConfirmationEmail')
        const freshOrder = await ordersDomain.getOrder(orderId)
        await enqueueOrderConfirmationEmail({
          merchantId: metadataMerchantId,
          storeName,
          orderStatusUrl,
          to: metadataBuyerEmail,
          buyerName: metadataBuyerName ?? null,
          order: freshOrder,
        })
        console.log(`[tap-webhook] Enqueued order-confirmation email for ${orderId} → ${metadataBuyerEmail}`)
      }
      catch (err) {
        console.warn(`[tap-webhook] Failed to enqueue order-confirmation email for ${orderId}:`, err)
      }
    }
    else {
      console.log(`[tap-webhook] Skipped order-confirmation email for ${orderId} — metadata missing merchantId or buyerEmail (older charge?)`)
    }

    console.log(`[tap-webhook] Order ${orderId} → processing (charge ${chargeId})`)
    return { received: true, chargeId, status: chargeStatus, action: 'order_updated', orderId }
  }
  catch (err: any) {
    console.error(`[tap-webhook] Failed to update order ${orderId}:`, err.message)
    return { received: true, chargeId, status: chargeStatus, action: 'error', error: err.message }
  }
})
