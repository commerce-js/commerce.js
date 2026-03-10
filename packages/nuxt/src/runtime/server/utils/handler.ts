// ---------------------------------------------------------------------------
// defineCommerceHandler — centralized error boundary + adapter injection
// ---------------------------------------------------------------------------
// Wraps all commerce API route handlers with:
// 1. Automatic adapter injection (no need to call useServerAdapter manually)
// 2. Request-scoped CommerceContext (requestId, locale, generateId)
// 3. Centralized error handling (CommerceError → proper HTTP error response)
// 4. Zod validation error handling (ZodError → 422 with structured errors)
//
// IMPORTANT: This file is SELF-CONTAINED. It inlines useServerAdapter and
// createCommerceContext to avoid any relative or virtual imports that break
// when Nitro bundles this file from node_modules for Cloudflare Workers.
// ---------------------------------------------------------------------------

import { defineEventHandler, createError } from 'h3'
import type { H3Event, EventHandler } from 'h3'
import type { CommerceAdapter } from '@commercejs/types'
import { isCommerceError } from '@commercejs/types'
import { ZodError } from 'zod'
import { ulid } from 'ulid'

// ---------------------------------------------------------------------------
// Inlined: useServerAdapter (from ./adapter.ts)
// ---------------------------------------------------------------------------

function useServerAdapter(event: H3Event): CommerceAdapter {
  const adapter = (event.context as any)._commerceAdapter as CommerceAdapter | undefined

  if (!adapter) {
    const initError = (event.context as any)._commerceInitError as Error | undefined
    throw createError({
      statusCode: 500,
      message: initError
        ? `[@commercejs/nuxt] Adapter init failed: ${initError.message}`
        : '[@commercejs/nuxt] No commerce adapter configured on the server.',
    })
  }

  return adapter
}

// ---------------------------------------------------------------------------
// Inlined: createCommerceContext (from ./context.ts)
// ---------------------------------------------------------------------------

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

function createCommerceContext(event: H3Event): CommerceContext {
  if (event.context[CONTEXT_KEY]) {
    return event.context[CONTEXT_KEY] as CommerceContext
  }

  const now = new Date()
  const header = event.node.req.headers['accept-language']
  const locale = header
    ? (header.split(',')[0]?.split(';')[0]?.trim() || 'en')
    : 'en'

  const ctx: CommerceContext = {
    requestId: ulid(now.getTime()),
    timestamp: now.toISOString(),
    locale,
    generateId: () => ulid(),
  }

  event.context[CONTEXT_KEY] = ctx
  return ctx
}

// ---------------------------------------------------------------------------
// defineCommerceHandler
// ---------------------------------------------------------------------------

/**
 * Define a commerce API handler with automatic adapter injection,
 * request-scoped context, and centralized error handling.
 *
 * @example
 * ```ts
 * export default defineCommerceHandler(async (event, adapter, ctx) => {
 *   const body = loginSchema.parse(await readBody(event))
 *   console.log(`[${ctx.requestId}] Login attempt for ${body.email}`)
 *   return adapter.login(body.email, body.password)
 * })
 * ```
 */
export function defineCommerceHandler<T>(
  handler: (event: H3Event, adapter: CommerceAdapter, ctx: CommerceContext) => T | Promise<T>,
): EventHandler {
  return defineEventHandler(async (event) => {
    try {
      const adapter = useServerAdapter(event)
      const ctx = createCommerceContext(event)
      return await handler(event, adapter, ctx)
    }
    catch (err: unknown) {
      // Re-throw h3 errors as-is (e.g. from readValidatedBody)
      if (err && typeof err === 'object' && 'statusCode' in err) {
        throw err
      }

      // Zod validation errors → 422
      if (err instanceof ZodError) {
        throw createError({
          statusCode: 422,
          message: 'Validation failed',
          data: {
            code: 'VALIDATION',
            errors: err.errors.map((e: any) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        })
      }

      // Map CommerceError to HTTP error
      if (isCommerceError(err)) {
        throw createError({
          statusCode: err.statusCode ?? 500,
          message: err.message,
          data: { code: err.code },
        })
      }

      // Unknown errors → 500
      console.error('[commerce] Unhandled error:', err)
      throw createError({
        statusCode: 500,
        message: 'Internal server error',
      })
    }
  })
}
