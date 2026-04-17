// ---------------------------------------------------------------------------
// date-bounds — shared date-filter parsing for admin list queries
// ---------------------------------------------------------------------------
//
// Admin UIs typically surface date-only filters ("from 2026-04-16 to 2026-04-17"),
// but Drizzle and Prisma both need Date objects and expect the bounds to be
// meaningful timestamps. Bare date-only strings:
//
//   - Passed raw to Prisma → validation crash (500).
//   - Wrapped in `new Date()` → parsed as UTC midnight, which silently
//     excludes anything from that calendar day when used as the upper bound.
//
// These helpers normalize both:
//
//   parseFromBound('2026-04-16') → 2026-04-16T00:00:00.000Z
//   parseToBound('2026-04-17')   → 2026-04-17T23:59:59.999Z
//   parseFromBound('2026-04-16T10:00:00Z') → unchanged (respects explicit time)
//   parseToBound('2026-04-17T10:00:00Z')   → unchanged
// ---------------------------------------------------------------------------

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

export function parseFromBound(input: string): Date {
  if (DATE_ONLY_RE.test(input)) return new Date(`${input}T00:00:00.000Z`)
  return new Date(input)
}

export function parseToBound(input: string): Date {
  if (DATE_ONLY_RE.test(input)) return new Date(`${input}T23:59:59.999Z`)
  return new Date(input)
}
