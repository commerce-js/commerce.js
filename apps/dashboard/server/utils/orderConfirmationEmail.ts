// ---------------------------------------------------------------------------
// Order-confirmation email builder (dashboard / storefront-native path)
// ---------------------------------------------------------------------------
//
// Extracts the common "build the vars payload from an Order + enqueue" step
// so callers are a one-liner. Mirror in apps/hosted-checkout keeps the same
// vars shape — any field added here must be added there (and in the template
// file at apps/dashboard/server/emails/order-confirmation.ts).
// ---------------------------------------------------------------------------

import type { Order } from '@commercejs/types'
import { enqueueMerchantJob } from './queue'
import type { OrderConfirmationVars } from '../emails/order-confirmation'

export interface EnqueueOrderConfirmationInput {
  merchantId: string
  storeName: string
  /** Full storefront URL to the buyer's order-status page. */
  orderStatusUrl: string
  /** Recipient email. Caller guards on presence — helper assumes it's set. */
  to: string
  /** Buyer display name for the greeting; optional. */
  buyerName?: string | null
  order: Order
}

/**
 * Build the vars payload from an Order and enqueue the email job.
 * No-ops at runtime are the caller's concern (guard on `to` before calling).
 */
export async function enqueueOrderConfirmationEmail(
  input: EnqueueOrderConfirmationInput,
): Promise<void> {
  const { merchantId, storeName, orderStatusUrl, to, buyerName, order } = input

  const vars: OrderConfirmationVars = {
    orderNumber: order.orderNumber,
    buyerName: buyerName ?? null,
    storeName,
    orderStatusUrl,
    currency: order.totals.total.currency,
    totalFormatted: order.totals.total.formatted,
    subtotalFormatted: order.totals.subtotal.formatted,
    shippingFormatted: order.totals.shipping?.formatted ?? null,
    taxFormatted: order.totals.tax?.formatted ?? null,
    items: order.items.map(item => ({
      // Resolve LocalizedString to English for v1; Arabic branch ships when
      // Merchant.locale-driven template selection lands.
      name: item.name.en || item.name.ar || '(Unnamed item)',
      quantity: item.quantity,
      totalFormatted: item.totalPrice.formatted,
      imageUrl: item.image?.url ?? null,
    })),
    shippingAddress: order.shippingAddress
      ? {
          firstName: order.shippingAddress.firstName,
          lastName: order.shippingAddress.lastName,
          street: order.shippingAddress.street,
          street2: order.shippingAddress.street2 ?? null,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state ?? null,
          postalCode: order.shippingAddress.postalCode ?? null,
          country: order.shippingAddress.country,
        }
      : null,
  }

  await enqueueMerchantJob({
    type: 'send-email',
    data: {
      merchantId,
      to,
      template: 'order-confirmation',
      vars: vars as unknown as Record<string, unknown>,
    },
  })
}
