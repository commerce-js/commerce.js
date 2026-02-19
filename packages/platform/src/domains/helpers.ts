// ---------------------------------------------------------------------------
// Shared helpers for domain implementations
// ---------------------------------------------------------------------------

import type { LocalizedString, Maybe, Price, DiscountablePrice, Image } from '@commercejs/types'

/** Create a bilingual LocalizedString from en/ar columns */
export function localized(en: string | null, ar: string | null): LocalizedString {
  return { en: en ?? '', ar: ar ?? '' }
}

/**
 * Convert a Prisma Decimal (or number) to a plain number.
 * Prisma returns Decimal fields as `Prisma.Decimal` objects which have `.toNumber()`.
 */
export function toNumber(value: any): number {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof value?.toNumber === 'function') return value.toNumber()
  return Number(value)
}

/** Create a Price from a numeric/Decimal value + currency */
export function price(amount: any, currency: string): Maybe<Price> {
  if (amount == null) return null
  const n = toNumber(amount)
  return { amount: n, currency, formatted: `${n} ${currency}` }
}

/** Create a non-null Price (for required fields) */
export function priceRequired(amount: any, currency: string): Price {
  const n = toNumber(amount)
  return { amount: n, currency, formatted: `${n} ${currency}` }
}

/** Create a DiscountablePrice from price + compareAt */
export function discountablePrice(
  amount: any,
  compareAt: any,
  currency: string,
): Maybe<DiscountablePrice> {
  if (amount == null) return null
  const a = toNumber(amount)
  const base: DiscountablePrice = {
    amount: a,
    currency,
    formatted: `${a} ${currency}`,
  }
  if (compareAt != null) {
    const c = toNumber(compareAt)
    if (c > a) {
      base.originalAmount = c
      base.discountPercent = Math.round(((c - a) / c) * 100)
    }
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

/**
 * Safely parse a JSON field from the database.
 * With PostgreSQL native Json type, Prisma returns objects directly.
 * This also handles legacy string values for compatibility.
 */
export function parseJsonField(value: unknown): any {
  if (value == null) return null
  if (typeof value === 'string') {
    try { return JSON.parse(value) }
    catch { return value }
  }
  return value
}

/** Generate an order number like ORD-20260211-XXXX */
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${date}-${random}`
}
