// ---------------------------------------------------------------------------
// @commercejs/core — withPlatformFallback()
// ---------------------------------------------------------------------------
// Wraps an orchestrator and fills missing domains with a fallback orchestrator.
// The primary use case is: Salla adapter provides catalog + customers, but
// Platform adapter fills in cart/checkout/orders that Salla doesn't support well.
// ---------------------------------------------------------------------------

import type {
  CommerceOrchestrator,
  DomainMap,
} from '@commercejs/types'
import { createOrchestrator } from './orchestrator.js'

/**
 * Wrap an orchestrator with a fallback that fills domain gaps.
 *
 * For each optional domain key, uses the primary orchestrator's domain
 * if available, otherwise falls back to the fallback orchestrator's domain.
 * Universal domains (catalog, store) always come from the primary.
 *
 * @example
 * ```ts
 * const sallaOrch = createOrchestrator({
 *   name: 'salla',
 *   catalog: sallaAdapter,
 *   store: sallaAdapter,
 *   domains: { customers: sallaAdapter, orders: sallaAdapter },
 * })
 *
 * const platformOrch = createOrchestrator({
 *   name: 'platform',
 *   catalog: platformAdapter,
 *   store: platformAdapter,
 *   domains: { cart: platformAdapter, checkout: platformAdapter },
 * })
 *
 * // Salla for catalog + customers + orders, Platform fills cart + checkout
 * const hybrid = withPlatformFallback(sallaOrch, platformOrch)
 * ```
 */
export function withPlatformFallback(
  primary: CommerceOrchestrator,
  fallback: CommerceOrchestrator,
): CommerceOrchestrator {
  // All possible domain keys
  const allDomainKeys: Array<keyof DomainMap> = [
    'cart', 'checkout', 'orders', 'customers', 'wishlist',
    'reviews', 'promotions', 'brands', 'countries', 'locations',
    'returns', 'wholesale', 'auctions', 'rentals', 'giftCards',
  ]

  // Merge domains: primary wins, fallback fills gaps
  const mergedDomains: Partial<DomainMap> = {}
  for (const key of allDomainKeys) {
    const domain = primary.domains[key] ?? fallback.domains[key]
    if (domain != null) {
      ;(mergedDomains as Record<string, unknown>)[key] = domain
    }
  }

  return createOrchestrator({
    name: `${primary.name}+fallback`,
    catalog: primary,   // Universal domains from primary
    store: primary,     // Universal domains from primary
    domains: mergedDomains,
  })
}
