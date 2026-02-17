// ---------------------------------------------------------------------------
// Cart mapper — MedusaCart → Commerce.js Cart
// ---------------------------------------------------------------------------

import type { Cart, CartItem, CartTotals, Price } from '@commercejs/types'
import type { MedusaCart, MedusaLineItem } from '../types.js'
import { mapMedusaAddress } from './customer.js'

/** Build a Price from amount (minor units) + currency */
function price(amount: number, currency: string): Price {
  return {
    amount,
    currency: currency.toUpperCase(),
    formatted: `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`,
  }
}

/** Map MedusaLineItem → Commerce.js CartItem */
function mapLineItem(item: MedusaLineItem, currency: string): CartItem {
  return {
    id: item.id,
    productId: item.product_id ?? '',
    productSlug: item.product?.handle,
    variantId: item.variant_id ?? null,
    name: { ar: item.title, en: item.title },
    variantName: item.variant
      ? { ar: item.variant.title, en: item.variant.title }
      : undefined,
    image: item.thumbnail ? { url: item.thumbnail, alt: item.title } : null,
    quantity: item.quantity,
    price: {
      ...price(item.unit_price, currency),
      originalAmount: item.original_total !== item.total
        ? item.original_total / item.quantity
        : undefined,
      discountPercent: item.discount_total > 0 && item.original_total > 0
        ? Math.round((item.discount_total / item.original_total) * 100)
        : undefined,
    },
    totalPrice: price(item.total, currency),
  }
}

/** Map MedusaCart → Commerce.js Cart */
export function mapMedusaCart(c: MedusaCart): Cart {
  const currency = c.currency_code
  const items = (c.items ?? []).map(i => mapLineItem(i, currency))

  const totals: CartTotals = {
    subtotal: price(c.subtotal, currency),
    shipping: c.shipping_total > 0 ? price(c.shipping_total, currency) : null,
    tax: c.tax_total > 0 ? price(c.tax_total, currency) : null,
    discount: c.discount_total > 0 ? price(c.discount_total, currency) : null,
    total: price(c.total, currency),
  }

  // Extract shipping method from cart's shipping_methods array
  const shippingMethod = c.shipping_methods?.[0]
    ? {
        id: c.shipping_methods[0].id,
        name: { ar: c.shipping_methods[0].name ?? 'Standard', en: c.shipping_methods[0].name ?? 'Standard' },
        provider: 'custom' as const,
        fulfillmentType: 'shipping' as const,
        estimatedDays: { min: 3, max: 7 },
        price: price(c.shipping_methods[0].amount, currency),
        cashOnDelivery: false,
      }
    : null

  // Extract payment method from payment collection
  const paymentSession = c.payment_collection?.payment_sessions?.[0]
  const paymentMethod = paymentSession
    ? {
        id: paymentSession.id,
        type: 'custom' as const,
        name: { ar: paymentSession.provider_id, en: paymentSession.provider_id },
        provider: paymentSession.provider_id,
        installments: null,
        icon: null,
      }
    : null

  return {
    id: c.id,
    items,
    totals,
    shippingAddress: c.shipping_address ? mapMedusaAddress(c.shipping_address) : null,
    billingAddress: c.billing_address ? mapMedusaAddress(c.billing_address) : null,
    shippingMethod,
    paymentMethod,
    couponCode: null, // Medusa V2 uses promotions, not coupon codes on the cart object
    customerId: c.customer_id ?? null,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }
}
