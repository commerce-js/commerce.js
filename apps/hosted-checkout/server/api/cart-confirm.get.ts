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

  try {
    const session = await provider.getSession(tapId)

    if (session.status === 'captured') {
      // Payment captured — update order status and clean up cart
      await ordersDomain.updateOrderStatus(orderId, {
        status: 'processing',
        note: `Card payment captured (Tap charge: ${tapId})`,
      })

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
