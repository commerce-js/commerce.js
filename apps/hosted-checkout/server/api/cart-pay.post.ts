// ---------------------------------------------------------------------------
// POST /api/cart-pay — Process Tap payment for a cart
// ---------------------------------------------------------------------------
// Body: { cartId, email, firstName?, phone?, sourceToken }
// Returns: { redirectUrl } for 3DS or { orderId, state: 'complete' }
// ---------------------------------------------------------------------------

import { createCheckoutDomain, createCartDomain } from '@commercejs/platform'
import { useTapProviderFromEnv } from '../utils/tap'
import { ensureDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.cartId) {
    throw createError({ statusCode: 400, message: 'cartId is required' })
  }

  ensureDb()
  const config = useRuntimeConfig()
  const currency = config.commerceCurrency || 'BHD'

  // Derive app URL from the incoming request so 3DS callbacks go to the
  // correct host (not localhost). Falls back to APP_URL config.
  const requestUrl = getRequestURL(event)
  const appUrl = config.public.appUrl && config.public.appUrl !== 'http://localhost:3100'
    ? config.public.appUrl
    : `${requestUrl.protocol}//${requestUrl.host}`

  // Get cart to calculate total
  const checkoutDomain = createCheckoutDomain(currency)
  const cartDomain = createCartDomain(currency)

  let cart
  try {
    cart = await cartDomain.getCart(body.cartId)
  }
  catch {
    throw createError({ statusCode: 404, message: 'Cart not found' })
  }

  if (cart.items.length === 0) {
    throw createError({ statusCode: 400, message: 'Cart is empty' })
  }

  // Calculate total including shipping
  const subtotal = cart.totals.subtotal.amount
  const shipping = cart.totals.shipping?.amount ?? 0
  const tax = cart.totals.tax?.amount ?? 0
  const discount = cart.totals.discount?.amount ?? 0
  const total = subtotal + shipping + tax - discount

  // Create Tap charge
  const { provider } = useTapProviderFromEnv()

  try {
    const session = await provider.createSession({
      amount: total,
      currency,
      sourceToken: body.sourceToken,
      returnUrl: `${appUrl}/api/cart-confirm?cartId=${body.cartId}&returnUrl=${encodeURIComponent(body.returnUrl || '')}`,
      webhookUrl: `${appUrl}/api/webhooks/tap-payment`,
      orderId: body.cartId,
      customer: {
        email: body.email,
        firstName: body.firstName,
        phone: body.phone,
      },
    })

    // If 3DS redirect needed
    if (session.redirectUrl) {
      return { redirectUrl: session.redirectUrl, chargeId: session.id }
    }

    // Direct capture (no 3DS) — place order immediately
    if (session.status === 'captured') {
      const order = await checkoutDomain.placeOrder(body.cartId)
      return { state: 'complete', orderId: order.id }
    }

    // Payment was not captured
    throw new Error(`Payment not captured: ${session.status}`)
  }
  catch (err: any) {
    if (err.statusCode) throw err // re-throw createError
    throw createError({
      statusCode: 400,
      message: err.message || 'Payment failed',
    })
  }
})
