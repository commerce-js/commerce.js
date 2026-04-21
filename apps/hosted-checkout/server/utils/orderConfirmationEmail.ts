// ---------------------------------------------------------------------------
// Order-confirmation email builder (hosted-checkout Tap path)
// ---------------------------------------------------------------------------
//
// Mirror of apps/dashboard/server/utils/orderConfirmationEmail.ts. The vars
// shape MUST match the registered `order-confirmation` template in the
// dashboard (apps/dashboard/server/emails/order-confirmation.ts). Any
// additive change to the vars contract needs to land in both files at the
// same time, or the worker will render stale/missing fields.
// ---------------------------------------------------------------------------

import type { Order } from '@commercejs/types'
import { enqueueMerchantJob } from './queue'

export interface EnqueueOrderConfirmationInput {
  merchantId: string
  storeName: string
  orderStatusUrl: string
  to: string
  buyerName?: string | null
  order: Order
}

export async function enqueueOrderConfirmationEmail(
  input: EnqueueOrderConfirmationInput,
): Promise<void> {
  const { merchantId, storeName, orderStatusUrl, to, buyerName, order } = input

  const vars = {
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
