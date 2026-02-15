import { computed, toValue } from '#imports'
import type { MaybeRefOrGetter } from 'vue'
import type { Price, DiscountablePrice } from '@commercejs/types'

/**
 * Reactive price formatting composable using `Intl.NumberFormat`.
 *
 * Formats prices according to the currency and locale, with support for
 * discount display and compact notation.
 *
 * @example
 * ```vue
 * <script setup>
 * const { formatPrice, formatDiscount } = usePrice()
 *
 * const product = ref({ price: { amount: 12.99, currency: 'SAR', formatted: '' } })
 * // formatPrice(product.value.price) → "SAR 12.99"
 * // formatPrice(product.value.price, 'ar-SA') → "١٢٫٩٩ ر.س"
 * </script>
 *
 * <template>
 *   <span>{{ formatPrice(product.price) }}</span>
 * </template>
 * ```
 */
export function usePrice(locale?: MaybeRefOrGetter<string>) {
  const resolvedLocale = computed(() => toValue(locale) || 'en-SA')

  /**
   * Format a `Price` object with `Intl.NumberFormat`.
   * Falls back to the pre-formatted string if Intl is unavailable.
   */
  function formatPrice(price: Price | null | undefined, overrideLocale?: string): string {
    if (!price) return ''
    try {
      return new Intl.NumberFormat(overrideLocale || resolvedLocale.value, {
        style: 'currency',
        currency: price.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price.amount)
    }
    catch {
      return price.formatted || `${price.currency} ${price.amount}`
    }
  }

  /**
   * Format a `DiscountablePrice` with both current and original price.
   * Returns `{ current, original, percent }` strings.
   */
  function formatDiscount(price: DiscountablePrice | null | undefined, overrideLocale?: string) {
    if (!price) return { current: '', original: '', percent: '' }

    const current = formatPrice(price, overrideLocale)
    const original = price.originalAmount != null
      ? formatPrice({ amount: price.originalAmount, currency: price.currency, formatted: '' }, overrideLocale)
      : ''
    const percent = price.discountPercent != null
      ? `${Math.round(price.discountPercent)}%`
      : ''

    return { current, original, percent }
  }

  /**
   * Format a raw amount + currency pair.
   */
  function formatAmount(amount: number, currency: string, overrideLocale?: string): string {
    try {
      return new Intl.NumberFormat(overrideLocale || resolvedLocale.value, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    }
    catch {
      return `${currency} ${amount.toFixed(2)}`
    }
  }

  return {
    formatPrice,
    formatDiscount,
    formatAmount,
    locale: resolvedLocale,
  }
}
