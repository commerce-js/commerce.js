// ---------------------------------------------------------------------------
// Salla → Order mapper
// ---------------------------------------------------------------------------

import type { Order, OrderItem, OrderStatus, FulfillmentStatus, Maybe, Image, LocalizedString, Price } from '@commercejs/types'
import type { SallaRawOrder, SallaRawOrderItem } from '../types.js'
import { mapSallaAddress } from './customer.js'

function toLocalized(value: string | null, locale: string = 'ar'): LocalizedString {
  if (locale === 'en') return { ar: '', en: value ?? '' }
  return { ar: value ?? '', en: '' }
}

function toPrice(amount: number, currency: string): Price {
  return { amount, currency, formatted: `${amount.toFixed(2)} ${currency}` }
}

/** Extract a date string from Salla's date object or ISO string */
function extractDate(date: string | { date: string; timezone_type: number; timezone: string } | undefined): string {
  if (!date) return new Date().toISOString()
  if (typeof date === 'string') return date
  return date.date
}

/** Map Salla order status slug → our OrderStatus */
function mapOrderStatus(slug: string): OrderStatus {
  switch (slug) {
    case 'under_review':
    case 'in_progress':
      return 'processing'
    case 'completed':
    case 'delivered':
      return 'delivered'
    case 'shipped':
    case 'in_transit':
      return 'shipped'
    case 'cancelled':
      return 'cancelled'
    case 'refunded':
      return 'refunded'
    case 'restoring':
    case 'restored':
      return 'returned'
    default:
      return 'pending'
  }
}

/** Map Salla raw order → unified Order */
export function mapSallaOrder(raw: SallaRawOrder, locale: string = 'ar'): Order {
  const currency = raw.currency || 'SAR'
  const items: OrderItem[] = raw.items.map((item) => mapSallaOrderItem(item, currency, locale))

  const requiresShipping = raw.shipping !== null

  // Listing endpoint may not include `amounts` — use top-level `total` as fallback
  const amounts = raw.amounts
  const fallbackTotal = (raw as any).total as { amount: number; currency: string } | undefined

  let subtotal = 0, shippingCost = 0, taxAmount = 0, discountTotal = 0, total = 0

  if (amounts) {
    subtotal = amounts.sub_total?.amount ?? 0
    shippingCost = amounts.shipping_cost?.amount ?? 0

    // discounts is an array in the real API — sum them up
    discountTotal = Array.isArray(amounts.discounts)
      ? amounts.discounts.reduce((sum, d) => sum + (d.amount ?? 0), 0)
      : (amounts.discounts as any)?.amount ?? 0

    // tax.amount is nested: { percent, amount: { amount, currency } }
    taxAmount = typeof amounts.tax?.amount === 'object'
      ? (amounts.tax.amount as { amount: number }).amount
      : amounts.tax?.amount ?? 0

    total = amounts.total?.amount ?? 0
  } else if (fallbackTotal) {
    total = fallbackTotal.amount
    subtotal = total
  }

  return {
    id: String(raw.id),
    orderNumber: String(raw.reference_id),
    status: mapOrderStatus(raw.status.slug),
    items,
    totals: {
      subtotal: toPrice(subtotal, currency),
      shipping: toPrice(shippingCost, currency),
      tax: toPrice(taxAmount, currency),
      discount: toPrice(discountTotal, currency),
      total: toPrice(total, currency),
    },
    shippingAddress: raw.shipping?.address ? mapSallaAddress(raw.shipping.address) : null,
    billingAddress: null,
    shippingMethod: raw.shipping?.company
      ? {
          id: 'salla-shipping',
          name: toLocalized(raw.shipping.company, locale),
          provider: 'custom',
          fulfillmentType: 'shipping' as const,
          estimatedDays: { min: 0, max: 0 },
          price: toPrice(shippingCost, currency),
          cashOnDelivery: false,
        }
      : null,
    paymentMethod: raw.payment_method
      ? {
          id: 'salla-payment',
          name: toLocalized(raw.payment_method, locale),
          type: 'custom',
          provider: raw.payment_method,
          icon: null,
          installments: null,
        }
      : null,
    trackingNumber: raw.shipping?.shipment?.tracking_number ?? null,
    trackingUrl: raw.shipping?.shipment?.tracking_link ?? null,
    note: raw.note,
    customerId: raw.customer ? String(raw.customer.id) : null,
    requiresShipping,
    createdAt: extractDate(raw.created_at),
    updatedAt: extractDate(raw.updated_at),

    // B2B fields
    paymentTerms: null,
    purchaseOrderNumber: null,
    companyName: null,
    giftCardCodesApplied: [],
    giftCardAmountApplied: null,
  }
}

/** Map Salla raw order item → unified OrderItem */
function mapSallaOrderItem(raw: SallaRawOrderItem, currency: string, locale: string): OrderItem {
  const image: Maybe<Image> = raw.image
    ? { url: raw.image.url, alt: raw.image.alt ?? '' }
    : raw.thumbnail
      ? { url: raw.thumbnail, alt: '' }
      : null

  return {
    id: String(raw.id ?? raw.name),
    productId: String(raw.product_id ?? ''),
    variantId: null,
    name: toLocalized(raw.name, locale),
    image,
    quantity: raw.quantity,
    price: raw.price ? toPrice(raw.price.amount, currency) : toPrice(0, currency),
    totalPrice: raw.total ? toPrice(raw.total.amount, currency) : toPrice(0, currency),
    fulfillmentStatus: 'unfulfilled' as FulfillmentStatus,
    productType: 'physical',
    digital: null,
    event: null,
  }
}
