// ---------------------------------------------------------------------------
// GET /api/cart-confirm — 3DS redirect callback
// ---------------------------------------------------------------------------
// Order-First flow: order already exists with status 'awaiting_payment'.
// This handler just verifies the charge status and updates the order.
//
// Query: orderId, cartId, returnUrl, tap_id
// ---------------------------------------------------------------------------

import { createOrdersDomain, createCartDomain, createProfileDomain } from '@commercejs/platform'
import { useTapProviderFromEnv } from '../utils/tap'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const orderId = query.orderId as string
  const cartId = query.cartId as string
  const returnUrl = query.returnUrl as string
  const tapId = query.tap_id as string
  const customerEmail = query.email as string | undefined

  if (!orderId) {
    throw createError({ statusCode: 400, message: 'orderId is required' })
  }

  const config = useRuntimeConfig()
  const currency = config.commerceCurrency || 'BHD'

  const { provider } = useTapProviderFromEnv()
  const ordersDomain = createOrdersDomain(currency)
  const cartDomain = createCartDomain(currency)

  // Tenant context (set by server/middleware/tenant.ts via the cjs_merchant
  // cookie that cart-pay set earlier in this session). Needed to enqueue
  // the order-confirmation email with merchantId + storeName.
  const merchant = event.context.merchant as { id: string, subdomain: string, name: string } | undefined

  try {
    const session = await provider.getSession(tapId)

    if (session.status === 'captured') {
      // Load current order state BEFORE transitioning so we can (a) avoid
      // re-transitioning if the webhook already won the race, and (b) use
      // the order as the email payload. The existing status guard doubles
      // as email-dedup — only the first path through fires the email.
      const currentOrder = await ordersDomain.getOrder(orderId)
      const alreadyProcessed
        = currentOrder.status === 'processing'
        || currentOrder.status === 'shipped'
        || currentOrder.status === 'delivered'

      if (!alreadyProcessed) {
        await ordersDomain.updateOrderStatus(orderId, {
          status: 'processing',
          note: `Card payment captured (Tap charge: ${tapId})`,
        })

        // Fire the buyer-facing order-confirmation email. Best-effort —
        // swallow errors so a Redis blip can't cause a false "payment
        // failed" redirect for the user. The webhook's own handler will
        // retry its enqueue if this one drops.
        if (merchant && customerEmail) {
          try {
            const { enqueueOrderConfirmationEmail } = await import('../utils/orderConfirmationEmail')
            // Re-fetch the post-transition order so totals + status reflect
            // the final state (updateOrderStatus may enrich the note).
            const freshOrder = await ordersDomain.getOrder(orderId)
            await enqueueOrderConfirmationEmail({
              merchantId: merchant.id,
              storeName: merchant.name,
              orderStatusUrl: returnUrl
                ? `${returnUrl}?id=${orderId}`
                : `https://${merchant.subdomain}.commercejs.cloud/order-confirmation?orderId=${orderId}`,
              to: customerEmail,
              buyerName: null,
              order: freshOrder,
            })
            console.log(`[cart-confirm] Enqueued order-confirmation email for ${orderId} → ${customerEmail}`)
          }
          catch (err) {
            console.warn(`[cart-confirm] Failed to enqueue order-confirmation email for ${orderId}:`, err)
          }
        }
      }
      else {
        console.log(`[cart-confirm] Order ${orderId} already ${currentOrder.status} — skipping transition + email (webhook won the race)`)
      }

      // Clean up the cart (may already be deleted by webhook — that's OK)
      if (cartId) {
        try { await cartDomain.deleteCart(cartId) } catch {}
      }

      // Persist tapCustomerId to profile for saved card re-use
      const tapCustomerId = (session.providerData as any)?.tapCustomerId ?? null

      if (tapCustomerId && customerEmail) {
        try {
          const profileDomain = createProfileDomain()
          const profile = await profileDomain.lookupByEmail(customerEmail)
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
            console.log(`[cart-confirm] Saved tapCustomerId ${tapCustomerId} for ${customerEmail}`)
          }
        }
        catch (err) {
          console.warn('[cart-confirm] Failed to save tapCustomerId:', err)
        }
      }

      console.log(`[cart-confirm] Order ${orderId} → processing (charge ${tapId})`)

      const redirectTo = returnUrl
        ? `${returnUrl}?id=${orderId}`
        : `/pay/cart?id=${cartId}&success=true&orderId=${orderId}`

      return sendRedirect(event, redirectTo)
    }

    // Payment failed — update order status
    await ordersDomain.updateOrderStatus(orderId, {
      status: 'cancelled',
      note: `Payment not captured: ${session.status} (Tap charge: ${tapId})`,
    })

    const failUrl = returnUrl
      ? `${returnUrl}?error=payment_failed`
      : `/pay/cart?id=${cartId}&error=payment_failed`

    return sendRedirect(event, failUrl)
  }
  catch (err: any) {
    const errorUrl = returnUrl
      ? `${returnUrl}?error=${encodeURIComponent(err.message || 'payment_error')}`
      : `/pay/cart?id=${cartId}&error=payment_error`

    return sendRedirect(event, errorUrl)
  }
})
