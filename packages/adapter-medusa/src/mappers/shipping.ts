// ---------------------------------------------------------------------------
// Shipping mapper — MedusaShippingOption → Commerce.js ShippingMethod
// ---------------------------------------------------------------------------

import type { ShippingMethod, Price } from '@commercejs/types'
import type { MedusaShippingOption } from '../types.js'

/** Build a Price from amount (minor units) + currency */
function price(amount: number, currency: string): Price {
  return {
    amount,
    currency: currency.toUpperCase(),
    formatted: `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`,
  }
}

/** Map MedusaShippingOption → Commerce.js ShippingMethod */
export function mapMedusaShippingOption(opt: MedusaShippingOption, currency: string): ShippingMethod {
  return {
    id: opt.id,
    name: { ar: opt.name, en: opt.name },
    provider: opt.provider_id ?? 'custom',
    fulfillmentType: 'shipping',
    estimatedDays: { min: 3, max: 7 },
    price: price(opt.amount, currency),
    cashOnDelivery: false,
  }
}
