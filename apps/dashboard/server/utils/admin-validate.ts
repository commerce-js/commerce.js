// ---------------------------------------------------------------------------
// admin-validate — small Zod helper for /api/admin/* route bodies & queries
// ---------------------------------------------------------------------------
//
// All admin write endpoints share the same "parse at the route boundary"
// shape: read body, .safeParse(), throw a 400 with the first issue on
// failure, otherwise return the typed data. Keeps the routes terse.
// ---------------------------------------------------------------------------

import { createError } from 'h3'
import type { ZodType } from 'zod'

export function parseOrThrow<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    const first = result.error.issues[0]
    const path = first?.path?.join('.') || 'body'
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
      message: `${path}: ${first?.message ?? 'validation failed'}`,
    })
  }
  return result.data
}
