// ---------------------------------------------------------------------------
// Analytics Provider — pluggable analytics/tracking for commerce events
// ---------------------------------------------------------------------------

/**
 * AnalyticsProvider — the interface for pluggable analytics services.
 *
 * Providers implement this to track user interactions, identify users,
 * and record page views. Commerce events are auto-tracked when an
 * analytics provider is registered.
 *
 * @example
 * ```ts
 * const ga: AnalyticsProvider = {
 *   id: 'ga4',
 *   name: 'Google Analytics 4',
 *   track: (event, properties) => gtag('event', event, properties),
 *   identify: (userId, traits) => gtag('set', 'user_properties', { user_id: userId, ...traits }),
 *   page: (name, properties) => gtag('event', 'page_view', { page_title: name, ...properties }),
 * }
 * ```
 */
export interface AnalyticsProvider {
  /** Unique provider identifier */
  readonly id: string

  /** Human-readable name */
  readonly name: string

  /**
   * Track a commerce or custom event.
   *
   * @param event - Event name (e.g., 'product.viewed', 'cart.item.added')
   * @param properties - Event properties (product data, cart data, etc.)
   */
  track(event: string, properties?: Record<string, unknown>): void

  /**
   * Identify a user (e.g., after login).
   *
   * @param userId - Unique user identifier
   * @param traits - User traits (email, name, etc.)
   */
  identify(userId: string, traits?: Record<string, unknown>): void

  /**
   * Record a page view.
   *
   * @param name - Page name/title
   * @param properties - Page properties (URL, referrer, etc.)
   */
  page(name: string, properties?: Record<string, unknown>): void
}
