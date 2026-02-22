// ---------------------------------------------------------------------------
// POST /api/sessions/[id]/pay — Submit payment
// ---------------------------------------------------------------------------
// Body: { sourceToken, email, firstName?, lastName?, phone?,
//         shippingAddress, shippingMethodId?, idempotencyKey? }
// Returns: { sessionId, redirectUrl?, ...snapshot }
// ---------------------------------------------------------------------------

import { sessions } from '../index.post'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !sessions.has(id)) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }

  const body = await readBody(event)
  const session = sessions.get(id)!

  try {
    // Step through the state machine if not already past these stages
    if (session.state === 'idle' && body.email) {
      session.setCustomerInfo({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
      })
    }

    if (session.state === 'info' && body.shippingAddress) {
      session.setShippingAddress(body.shippingAddress, body.billingAddress)
    }

    if (session.state === 'shipping') {
      if (body.shippingMethodId) {
        session.setShippingMethod(body.shippingMethodId)
      }
      else {
        // Default shipping method for digital/simple checkout
        session.setShippingMethod('default')
      }
    }

    // Submit payment
    const paymentSession = await session.submitPayment({
      sourceToken: body.sourceToken,
      idempotencyKey: body.idempotencyKey,
      saveCard: true,
      customerId: body.tapCustomerId || undefined,
    })

    return {
      sessionId: id,
      redirectUrl: paymentSession.redirectUrl,
      // Tap customer + card info for saving to profile
      tapCustomerId: (paymentSession.providerData as any)?.tapCustomerId ?? null,
      savedCard: (paymentSession.providerData as any)?.savedCard ?? null,
      ...session.toSnapshot(),
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Payment failed'
    throw createError({ statusCode: 400, message })
  }
})
