// ---------------------------------------------------------------------------
// POST /api/cart-pay — Process Tap payment for a cart
// ---------------------------------------------------------------------------
// Order-First flow:
//   1. Create order (status: awaiting_payment, keep cart)
//   2. Create Tap charge with reference.order = orderId
//   3. Return redirect URL for 3DS (or complete if direct capture)
//
// Body: { cartId, email, firstName?, phone?, sourceToken, returnUrl? }
// Returns: { redirectUrl } for 3DS or { orderId, state: 'complete' }
// ---------------------------------------------------------------------------

import { createCheckoutDomain, createCartDomain, createOrdersDomain } from '@commercejs/platform'
import { useTapProviderFromEnv } from '../utils/tap'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.cartId) {
    throw createError({ statusCode: 400, message: 'cartId is required' })
  }

  const config = useRuntimeConfig()
  const currency = config.commerceCurrency || 'BHD'

  // Derive app URL from the incoming request so 3DS callbacks go to the
  // correct host (not localhost). Falls back to APP_URL config.
  const requestUrl = getRequestURL(event)
  const appUrl = config.public.appUrl && config.public.appUrl !== 'http://localhost:3100'
    ? config.public.appUrl
    : `${requestUrl.protocol}//${requestUrl.host}`

  const cartDomain = createCartDomain(currency)
  const checkoutDomain = createCheckoutDomain(currency)
  const ordersDomain = createOrdersDomain(currency)

  // Validate cart
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

  // ── Step 1: Create order (awaiting_payment, keep cart) ──────────────
  const order = await checkoutDomain.placeOrder(body.cartId, {
    status: 'pending',
    keepCart: true,
  })

  console.log(`[cart-pay] Order ${order.id} created (pending) for cart ${body.cartId}`)

  // Calculate total (from the created order)
  const total = order.totals.total.amount

  // ── Step 2: Create Tap charge with orderId ─────────────────────────
  const { provider } = useTapProviderFromEnv()

  try {
    const session = await provider.createSession({
      amount: total,
      currency,
      sourceToken: body.sourceToken,
      saveCard: true,
      customerId: body.tapCustomerId || undefined,
      returnUrl: `${appUrl}/api/cart-confirm?orderId=${order.id}&cartId=${body.cartId}&email=${encodeURIComponent(body.email || '')}&returnUrl=${encodeURIComponent(body.returnUrl || '')}`,
      webhookUrl: `${appUrl}/api/webhooks/tap-payment`,
      orderId: order.id,
      metadata: { cartId: body.cartId },
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

    // Direct capture (no 3DS) — update order status immediately
    if (session.status === 'captured') {
      await ordersDomain.updateOrderStatus(order.id, {
        status: 'processing',
        note: `Card payment captured directly (Tap charge: ${session.id})`,
      })
      await cartDomain.deleteCart(body.cartId)
      return { state: 'complete', orderId: order.id }
    }

    // Payment was not captured — cancel the order
    await ordersDomain.updateOrderStatus(order.id, {
      status: 'cancelled',
      note: `Payment not captured: ${session.status}`,
    })
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
