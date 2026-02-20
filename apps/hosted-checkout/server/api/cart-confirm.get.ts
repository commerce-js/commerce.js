// ---------------------------------------------------------------------------
// GET /api/cart-confirm — Handle 3DS redirect back from Tap
// ---------------------------------------------------------------------------
// Query: { cartId, returnUrl, tap_id }
// After 3DS, Tap redirects here. We check charge status and place order.
// ---------------------------------------------------------------------------

import { createCheckoutDomain } from '@commercejs/platform'
import { useTapProviderFromEnv } from '../utils/tap'
import { ensureDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const cartId = query.cartId as string
  const returnUrl = query.returnUrl as string
  const tapId = query.tap_id as string

  if (!cartId) {
    throw createError({ statusCode: 400, message: 'cartId is required' })
  }

  ensureDb()
  const config = useRuntimeConfig()
  const currency = config.commerceCurrency || 'BHD'

  // Check charge status with Tap
  const { provider } = useTapProviderFromEnv()

  try {
    const session = await provider.getSession(tapId)

    if (session.status === 'captured') {
      // Payment successful — place the order
      const checkoutDomain = createCheckoutDomain(currency)
      const order = await checkoutDomain.placeOrder(cartId)

      // Redirect to storefront order confirmation
      const redirectTo = returnUrl
        ? `${returnUrl}?id=${order.id}`
        : `/pay/cart?id=${cartId}&success=true&orderId=${order.id}`

      return sendRedirect(event, redirectTo)
    }

    // Payment failed or cancelled
    const failUrl = returnUrl
      ? `${returnUrl}?error=payment_failed`
      : `/pay/cart?id=${cartId}&error=payment_failed`

    return sendRedirect(event, failUrl)
  }
  catch (err: any) {
    // On error, redirect back with error
    const errorUrl = returnUrl
      ? `${returnUrl}?error=${encodeURIComponent(err.message || 'payment_error')}`
      : `/pay/cart?id=${cartId}&error=payment_error`

    return sendRedirect(event, errorUrl)
  }
})
