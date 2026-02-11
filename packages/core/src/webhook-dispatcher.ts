// ---------------------------------------------------------------------------
// @commercejs/core — Webhook Dispatcher
// ---------------------------------------------------------------------------
// Dispatches commerce events to external webhook endpoints.
// Subscribers register webhook URLs for specific events.
// The dispatcher posts JSON payloads with configurable retry logic.
// ---------------------------------------------------------------------------

import type { CommerceEvents } from './events.js'
import type { CommerceEventBus } from './event-bus.js'

import consola from 'consola'

const logger = consola.withTag('@commercejs/core')

// ---- Types ----

export interface WebhookEndpoint {
  /** Unique endpoint identifier */
  id: string
  /** Target URL to POST events to */
  url: string
  /** Events this endpoint subscribes to. Use '*' for all events. */
  events: string[]
  /** Optional shared secret for HMAC signing */
  secret?: string
  /** Whether this endpoint is active */
  active?: boolean
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

export interface WebhookDispatcherConfig {
  /** Registered webhook endpoints */
  endpoints: WebhookEndpoint[]
  /** Max retry attempts on failure (default: 3) */
  maxRetries?: number
  /** Custom fetch implementation (useful for testing or edge runtimes) */
  fetch?: typeof globalThis.fetch
  /** Optional signing function (receives payload + secret, returns signature) */
  sign?: (payload: string, secret: string) => string | Promise<string>
}

export interface WebhookDelivery {
  endpointId: string
  event: string
  payload: unknown
  timestamp: string
  status: 'success' | 'failed'
  statusCode?: number
  attempts: number
  error?: string
}

// ---- Dispatcher ----

/**
 * Webhook dispatcher — subscribes to the event bus and POSTs events
 * to registered external endpoints.
 *
 * @example
 * ```ts
 * const dispatcher = createWebhookDispatcher(bus, {
 *   endpoints: [
 *     { id: 'crm', url: 'https://crm.example.com/webhook', events: ['order.created'] },
 *     { id: 'analytics', url: 'https://analytics.example.com/hook', events: ['*'] },
 *   ],
 * })
 * ```
 */
export function createWebhookDispatcher(
  bus: CommerceEventBus<CommerceEvents>,
  config: WebhookDispatcherConfig,
): { unsubscribe: () => void; deliveries: WebhookDelivery[] } {
  const {
    endpoints,
    maxRetries = 3,
    fetch: fetchFn = globalThis.fetch,
    sign,
  } = config

  const deliveries: WebhookDelivery[] = []
  const unsubscribers: (() => void)[] = []

  // Collect all unique events across endpoints
  const eventSet = new Set<string>()
  const wildcardEndpoints: WebhookEndpoint[] = []

  for (const endpoint of endpoints) {
    if (!endpoint.active && endpoint.active !== undefined) continue

    for (const event of endpoint.events) {
      if (event === '*') {
        wildcardEndpoints.push(endpoint)
      }
      else {
        eventSet.add(event as string)
      }
    }
  }

  // Subscribe to specific events
  for (const event of eventSet) {
    const eventEndpoints = endpoints.filter(
      ep => (ep.active !== false) && ep.events.includes(event as string),
    )

    const unsub = bus.on(event as string & keyof CommerceEvents, async (data: unknown) => {
      await dispatchToEndpoints(eventEndpoints, event as string, data)
    })
    unsubscribers.push(unsub)
  }

  // Subscribe to wildcard if any endpoint wants '*'
  if (wildcardEndpoints.length > 0) {
    const unsub = bus.onAny(async (event, data) => {
      await dispatchToEndpoints(wildcardEndpoints, event, data)
    })
    unsubscribers.push(unsub)
  }

  async function dispatchToEndpoints(eps: WebhookEndpoint[], event: string, data: unknown) {
    for (const endpoint of eps) {
      await deliverWithRetry(endpoint, event, data)
    }
  }

  async function deliverWithRetry(endpoint: WebhookEndpoint, event: string, data: unknown) {
    const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() })
    const delivery: WebhookDelivery = {
      endpointId: endpoint.id,
      event,
      payload: data,
      timestamp: new Date().toISOString(),
      status: 'failed',
      attempts: 0,
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      delivery.attempts = attempt
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Commerce-Event': event,
          'X-Commerce-Delivery': `${endpoint.id}-${Date.now()}`,
        }

        // Sign the payload if a signing function and secret are provided
        if (sign && endpoint.secret) {
          headers['X-Commerce-Signature'] = await sign(payload, endpoint.secret)
        }

        const response = await fetchFn(endpoint.url, {
          method: 'POST',
          headers,
          body: payload,
        })

        delivery.statusCode = response.status

        if (response.ok) {
          delivery.status = 'success'
          deliveries.push(delivery)
          return
        }

        // Non-retryable status codes
        if (response.status >= 400 && response.status < 500) {
          delivery.error = `HTTP ${response.status}`
          deliveries.push(delivery)
          logger.warn(`Webhook delivery to ${endpoint.url} failed: HTTP ${response.status}`)
          return
        }

        delivery.error = `HTTP ${response.status}`
      }
      catch (err) {
        delivery.error = err instanceof Error ? err.message : String(err)
      }

      // Wait before retry (exponential backoff: 1s, 2s, 4s)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (2 ** (attempt - 1))))
      }
    }

    deliveries.push(delivery)
    logger.warn(`Webhook delivery to ${endpoint.url} failed after ${maxRetries} attempts`)
  }

  return {
    unsubscribe: () => {
      for (const unsub of unsubscribers) unsub()
    },
    deliveries,
  }
}
