// ---------------------------------------------------------------------------
// Order mapper — MedusaOrder → Commerce.js Order
// ---------------------------------------------------------------------------

import type { Order, OrderItem, OrderStatus, FulfillmentStatus, Price } from '@commercejs/types'
import type { MedusaOrder, MedusaOrderItem } from '../types.js'
import { mapMedusaAddress } from './customer.js'

/** Build a Price from amount (minor units) + currency */
function price(amount: number, currency: string): Price {
  return {
    amount,
    currency: currency.toUpperCase(),
    formatted: `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`,
  }
}

/** Map Medusa order status → Commerce.js OrderStatus */
function mapOrderStatus(status: string): OrderStatus {
  switch (status) {
    case 'pending': return 'pending'
    case 'completed': return 'delivered'
    case 'archived': return 'delivered'
    case 'canceled': return 'cancelled'
    case 'requires_action': return 'processing'
    default: return 'processing'
  }
}

/** Map fulfillment status */
function mapFulfillmentStatus(item: MedusaOrderItem): FulfillmentStatus {
  if (item.fulfilled_quantity && item.fulfilled_quantity >= item.quantity) return 'fulfilled'
  if (item.fulfilled_quantity && item.fulfilled_quantity > 0) return 'partially_fulfilled'
  return 'unfulfilled'
}

/** Map MedusaOrderItem → Commerce.js OrderItem */
function mapOrderItem(item: MedusaOrderItem, currency: string): OrderItem {
  return {
    id: item.id,
    productId: item.product_id ?? '',
    variantId: item.variant_id ?? null,
    name: { ar: item.title, en: item.title },
    image: item.thumbnail ? { url: item.thumbnail, alt: item.title } : null,
    quantity: item.quantity,
    price: price(item.unit_price, currency),
    totalPrice: price(item.total, currency),
    fulfillmentStatus: mapFulfillmentStatus(item),
    productType: 'physical',
    digital: null,
    event: null,
  }
}

/** Map MedusaOrder → Commerce.js Order */
export function mapMedusaOrder(o: MedusaOrder): Order {
  const currency = o.currency_code
  const items = (o.items ?? []).map(i => mapOrderItem(i, currency))

  const shippingMethod = o.shipping_methods?.[0]
    ? {
        id: o.shipping_methods[0].id,
        name: { ar: o.shipping_methods[0].name ?? 'Standard', en: o.shipping_methods[0].name ?? 'Standard' },
        provider: 'custom' as const,
        fulfillmentType: 'shipping' as const,
        estimatedDays: { min: 3, max: 7 },
        price: price(o.shipping_methods[0].amount, currency),
        cashOnDelivery: false,
      }
    : null

  return {
    id: o.id,
    orderNumber: `#${o.display_id}`,
    status: mapOrderStatus(o.status),
    items,
    totals: {
      subtotal: price(o.subtotal, currency),
      shipping: o.shipping_total > 0 ? price(o.shipping_total, currency) : null,
      tax: o.tax_total > 0 ? price(o.tax_total, currency) : null,
      discount: o.discount_total > 0 ? price(o.discount_total, currency) : null,
      total: price(o.total, currency),
    },
    shippingAddress: o.shipping_address ? mapMedusaAddress(o.shipping_address) : null,
    billingAddress: o.billing_address ? mapMedusaAddress(o.billing_address) : null,
    shippingMethod,
    paymentMethod: null,
    trackingNumber: null,
    trackingUrl: null,
    note: null,
    customerId: o.customer_id ?? null,
    requiresShipping: true,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    paymentTerms: null,
    purchaseOrderNumber: null,
    companyName: null,
    giftCardCodesApplied: [],
    giftCardAmountApplied: null,
  }
}
