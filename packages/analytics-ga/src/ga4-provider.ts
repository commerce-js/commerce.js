// ---------------------------------------------------------------------------
// Google Analytics 4 Provider for CommerceJS
// ---------------------------------------------------------------------------

import type { AnalyticsProvider } from '@commercejs/types'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface GA4ProviderConfig {
  /** GA4 Measurement ID (e.g. "G-XXXXXXXXXX") */
  measurementId: string

  /**
   * Custom `gtag` function.
   * Defaults to `window.gtag` in browser environments.
   * Pass a custom function for SSR/testing.
   */
  gtag?: GtagFunction

  /**
   * Whether to send events in debug mode.
   * When enabled, adds `debug_mode: true` to all events.
   */
  debug?: boolean
}

/** gtag function signature */
export type GtagFunction = (...args: unknown[]) => void

// ---------------------------------------------------------------------------
// Commerce-to-GA4 event mapping
// ---------------------------------------------------------------------------

/**
 * Maps CommerceJS event names to GA4 recommended event names.
 * Events not in this map are sent as-is (custom events).
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 */
const EVENT_MAP: Record<string, string> = {
  'product.viewed': 'view_item',
  'cart.created': 'begin_checkout',
  'cart.item.added': 'add_to_cart',
  'cart.item.removed': 'remove_from_cart',
  'checkout.started': 'begin_checkout',
  'checkout.completed': 'purchase',
  'order.created': 'purchase',
  'payment.created': 'add_payment_info',
  'payment.confirmed': 'add_payment_info',
  'customer.registered': 'sign_up',
  'customer.logged_in': 'login',
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Create a Google Analytics 4 analytics provider.
 *
 * Automatically maps CommerceJS events to GA4 recommended events.
 * Custom events are forwarded as-is.
 *
 * @example
 * ```ts
 * import { createGA4Provider } from '@commercejs/analytics-ga'
 *
 * const ga4 = createGA4Provider({
 *   measurementId: 'G-XXXXXXXXXX',
 * })
 *
 * // Register in createCommerce()
 * const commerce = createCommerce({
 *   adapter,
 *   analytics: [ga4],
 * })
 * ```
 */
export function createGA4Provider(config: GA4ProviderConfig): AnalyticsProvider {
  let gtagFn: GtagFunction | null = config.gtag ?? null

  function getGtag(): GtagFunction | null {
    if (gtagFn) return gtagFn
    // Try to use global gtag in browser
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).gtag === 'function') {
      gtagFn = (globalThis as any).gtag
      return gtagFn
    }
    return null
  }

  /**
   * Initialize GA4 config if not already done.
   * Called lazily on first event.
   */
  let initialized = false
  function ensureInitialized(): void {
    if (initialized) return
    const gtag = getGtag()
    if (!gtag) return
    gtag('config', config.measurementId, {
      send_page_view: false,  // We handle page views explicitly
      ...(config.debug ? { debug_mode: true } : {}),
    })
    initialized = true
  }

  function mapEventName(event: string): string {
    return EVENT_MAP[event] ?? event.replace(/\./g, '_')
  }

  return {
    id: 'ga4',
    name: 'Google Analytics 4',

    track(event: string, properties?: Record<string, unknown>): void {
      ensureInitialized()
      const gtag = getGtag()
      if (!gtag) return

      const ga4Event = mapEventName(event)
      gtag('event', ga4Event, {
        ...properties,
        ...(config.debug ? { debug_mode: true } : {}),
      })
    },

    identify(userId: string, traits?: Record<string, unknown>): void {
      ensureInitialized()
      const gtag = getGtag()
      if (!gtag) return

      gtag('set', 'user_properties', {
        user_id: userId,
        ...traits,
      })
    },

    page(name: string, properties?: Record<string, unknown>): void {
      ensureInitialized()
      const gtag = getGtag()
      if (!gtag) return

      gtag('event', 'page_view', {
        page_title: name,
        ...properties,
        ...(config.debug ? { debug_mode: true } : {}),
      })
    },
  }
}
