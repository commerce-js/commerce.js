// ---------------------------------------------------------------------------
// Shared currency formatting composable
// ---------------------------------------------------------------------------
// Reads the store's configured currency from settings and provides a
// formatCurrency function that handles both price objects and raw amounts.
//
// IMPORTANT: Amounts in the Commerce.js API are stored in **major units**
// (e.g. 100 = 100 SAR, not 10000 halalah). No minor-unit conversion needed.

/**
 * Decimal places per currency — consistent with Tap Payments requirements.
 * @see packages/webhook-verifier/src/formatters/tap.ts
 */
const CURRENCY_DECIMALS: Record<string, number> = {
  BHD: 3,
  KWD: 3,
  OMR: 3,
  JOD: 3,
  AED: 2,
  SAR: 2,
  QAR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  EGP: 2,
}

/**
 * Returns a `formatCurrency` helper that uses the store's currency.
 *
 * Accepts either:
 *  - A price object `{ amount, currency, formatted }` (from the API)
 *  - A raw number in major units (e.g. 49.85 SAR)
 *
 * Falls back to store currency when the price object has no currency field.
 */
export function useFormatCurrency() {
  const adminClient = useAdminClient()

  // Fetch store settings once — cached by Nuxt's useAsyncData across pages
  const { data: storeSettings } = useAsyncData('store-settings-currency', () =>
    adminClient.getStoreSettings(),
    { lazy: true }
  )

  function formatCurrency(price: any): string {
    if (price == null) return '—'

    let amount: number
    let currency: string

    if (typeof price === 'object' && price !== null) {
      // Price object from API: { amount, currency, formatted }
      if (price.formatted) return price.formatted
      amount = price.amount ?? 0
      currency = price.currency || storeSettings.value?.currency || 'USD'
    } else {
      amount = Number(price) || 0
      currency = storeSettings.value?.currency || 'USD'
    }

    const decimals = CURRENCY_DECIMALS[currency] ?? 2

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)
  }

  return { formatCurrency }
}
