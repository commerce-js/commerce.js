// POST /api/storefront/checkout/complete — finalize the order
//
// Places the order through the adapter and clears the cart ID from the
// buyer session (customer stays logged in). Returns the created order.
// On success, enqueues an order-confirmation email (v1: only when a
// logged-in buyer's email is resolvable — guest orders without a
// persisted customer email are skipped; a best-effort side effect
// should never fail the checkout response).
import { defineStorefrontHandler } from '../../../utils/storefrontHandler'
import { getBuyerSession, updateBuyerSession } from '../../../utils/buyerSession'
import { enqueueOrderConfirmationEmail } from '../../../utils/orderConfirmationEmail'

export default defineStorefrontHandler(async (event, { adapter, admin, merchant }) => {
  const session = await getBuyerSession(event)
  if (!session.cartId) {
    throw createError({ statusCode: 404, message: 'No active cart' })
  }

  const order = await adapter.placeOrder(session.cartId)
  // Clear cart ID but keep customerId if present
  await updateBuyerSession(event, { cartId: undefined })

  // ── Best-effort order-confirmation email ──────────────────────────────
  // Never throws — email is a side effect, not part of the checkout
  // contract. Buyer sees the order land regardless of email outcome.
  try {
    // Email resolution order:
    //   1. Logged-in buyer → admin.getCustomer(customerId).email
    //   2. Guest with customerId set on order → same path
    //   3. Guest without customerId → skip (no email on record)
    const customerId = session.customerId ?? order.customerId ?? null
    if (customerId) {
      const customer = await admin.getCustomer(customerId).catch(() => null)
      const email = (customer as any)?.email as string | undefined
      const buyerName = customer
        ? [(customer as any).firstName, (customer as any).lastName]
            .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
            .join(' ')
            .trim() || null
        : null

      if (email) {
        const host = getRequestHost(event, { xForwardedHost: true })
        const proto = getRequestProtocol(event, { xForwardedProto: true })
        const orderStatusUrl = `${proto}://${host}/order-confirmation?orderId=${order.id}`

        await enqueueOrderConfirmationEmail({
          merchantId: merchant.id,
          storeName: merchant.name,
          orderStatusUrl,
          to: email,
          buyerName,
          order,
        })
      }
      else {
        console.log(`[checkout/complete] Skipped order-confirmation email for order ${order.id} — customer ${customerId} has no email on record.`)
      }
    }
    else {
      console.log(`[checkout/complete] Skipped order-confirmation email for order ${order.id} — no customerId (guest checkout).`)
    }
  }
  catch (err) {
    console.warn(`[checkout/complete] Failed to enqueue order-confirmation email for order ${order.id}:`, err)
  }

  return order
})
