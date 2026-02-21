// ---------------------------------------------------------------------------
// GET /api/cart-confirm — 3DS redirect callback
// ---------------------------------------------------------------------------
// Order-First flow: order already exists with status 'awaiting_payment'.
// This handler just verifies the charge status and updates the order.
//
// Query: orderId, cartId, returnUrl, tap_id
// ---------------------------------------------------------------------------

import { createOrdersDomain, createCartDomain } from '@commercejs/platform'
import { useTapProviderFromEnv } from '../utils/tap'
import { ensureDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const orderId = query.orderId as string
  const cartId = query.cartId as string
  const returnUrl = query.returnUrl as string
  const tapId = query.tap_id as string

  if (!orderId) {
    throw createError({ statusCode: 400, message: 'orderId is required' })
  }

  ensureDb()
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
