/**
 * Price formatting composable.
 */
import type { Price, DiscountablePrice, Maybe } from '@commercejs/types'

export function usePrice() {
  /** Format a Price object for display */
  function formatPrice(price: Maybe<Price> | undefined): string {
    if (!price) return ''
    if (price.formatted) return price.formatted
    return `${price.currency} ${price.amount.toFixed(2)}`
  }

  /** Check if a price has a discount */
  function hasDiscount(price: Maybe<DiscountablePrice> | undefined): boolean {
    if (!price) return false
    return (price as DiscountablePrice).discountPercent != null &&
      (price as DiscountablePrice).discountPercent! > 0
  }

  /** Format original / pre-discount price */
  function formatOriginal(price: Maybe<DiscountablePrice> | undefined): string {
    if (!price) return ''
    const dp = price as DiscountablePrice
    if (dp.originalAmount == null) return ''
    return `${price!.currency} ${dp.originalAmount.toFixed(2)}`
  }

  return { formatPrice, hasDiscount, formatOriginal }
}
