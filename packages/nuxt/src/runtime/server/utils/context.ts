// ---------------------------------------------------------------------------
// CommerceContext — request-scoped context for server handlers
// ---------------------------------------------------------------------------

import { ulid } from 'ulid'
import type { H3Event } from 'h3'

/**
 * Request-scoped context available in every commerce handler.
 *
 * Provides:
 * - `requestId` — ULID-based, lexicographically sortable, unique per request
 * - `timestamp` — ISO 8601 timestamp of request receipt
 * - `locale` — Resolved locale from Accept-Language header (defaults to 'en')
 * - `generateId()` — Creates new ULIDs for order numbers, transaction refs, etc.
 */
export interface CommerceContext {
  /** ULID-based request identifier — sortable and unique */
  requestId: string
  /** ISO 8601 timestamp when the request was received */
  timestamp: string
  /** Resolved locale from Accept-Language header */
  locale: string
  /** Generate a new ULID suitable for order numbers, refs, etc. */
  generateId: () => string
}

const CONTEXT_KEY = '_commerceContext' as const

/**
 * Create a new `CommerceContext` for the current request.
 * Context is cached on `event.context` so it's created once per request.
 */
export function createCommerceContext(event: H3Event): CommerceContext {
  // Return cached context if already created for this request
  if (event.context[CONTEXT_KEY]) {
    return event.context[CONTEXT_KEY] as CommerceContext
  }

  const now = new Date()
  const locale = resolveLocale(event)

  const ctx: CommerceContext = {
    requestId: ulid(now.getTime()),
    timestamp: now.toISOString(),
    locale,
    generateId: () => ulid(),
  }

  // Cache on event.context for idempotent access
  event.context[CONTEXT_KEY] = ctx
  return ctx
}

/**
 * Get the existing `CommerceContext` from the request.
 * Returns null if context hasn't been created yet.
 */
export function useCommerceContext(event: H3Event): CommerceContext | null {
  return (event.context[CONTEXT_KEY] as CommerceContext) ?? null
}

/** Extract locale from Accept-Language header, defaulting to 'en' */
function resolveLocale(event: H3Event): string {
  const header = event.node.req.headers['accept-language']
  if (!header) return 'en'

  // Parse "ar-SA,ar;q=0.9,en;q=0.8" → first language tag
  const primary = header.split(',')[0]?.split(';')[0]?.trim()
  return primary || 'en'
}
