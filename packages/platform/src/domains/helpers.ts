// ---------------------------------------------------------------------------
// Shared helpers for domain implementations
// ---------------------------------------------------------------------------

import type { LocalizedString, Maybe, Price, DiscountablePrice, Image } from '@commercejs/types'

/** Create a bilingual LocalizedString from en/ar columns */
export function localized(en: string | null, ar: string | null): LocalizedString {
  return { en: en ?? '', ar: ar ?? '' }
}

/** Create a Price from a numeric value + currency */
export function price(amount: number | null | undefined, currency: string): Maybe<Price> {
  if (amount == null) return null
  return { amount, currency, formatted: `${amount} ${currency}` }
}

/** Create a non-null Price (for required fields) */
export function priceRequired(amount: number, currency: string): Price {
  return { amount, currency, formatted: `${amount} ${currency}` }
}

/** Create a DiscountablePrice from price + compareAt */
export function discountablePrice(
  amount: number | null,
  compareAt: number | null,
  currency: string,
): Maybe<DiscountablePrice> {
  if (amount == null) return null
  const base: DiscountablePrice = {
    amount,
    currency,
    formatted: `${amount} ${currency}`,
  }
  if (compareAt != null && compareAt > amount) {
    base.originalAmount = compareAt
    base.discountPercent = Math.round(((compareAt - amount) / compareAt) * 100)
  }
  return base
}

/** Create an Image from url + altText */
export function img(url: string, altText: string | null): Image {
  return {
    url,
    alt: altText ?? '',
  }
}

/** Generate an order number like ORD-20260211-XXXX */
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${date}-${random}`
}
