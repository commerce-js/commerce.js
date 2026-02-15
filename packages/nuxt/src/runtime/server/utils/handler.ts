// ---------------------------------------------------------------------------
// defineCommerceHandler — centralized error boundary + adapter injection
// ---------------------------------------------------------------------------
// Wraps all commerce API route handlers with:
// 1. Automatic adapter injection (no need to call useServerAdapter manually)
// 2. Request-scoped CommerceContext (requestId, locale, generateId)
// 3. Centralized error handling (CommerceError → proper HTTP error response)
// 4. Zod validation error handling (ZodError → 422 with structured errors)
// ---------------------------------------------------------------------------

import { defineEventHandler, createError } from 'h3'
import type { H3Event, EventHandler } from 'h3'
import type { CommerceAdapter } from '@commercejs/types'
import { isCommerceError } from '@commercejs/types'
import { ZodError } from 'zod'
import { useServerAdapter } from './adapter'
import { createCommerceContext } from './context'
import type { CommerceContext } from './context'

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
            errors: err.errors.map(e => ({
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
      throw createError({
        statusCode: 500,
        message: 'Internal server error',
      })
    }
  })
}
