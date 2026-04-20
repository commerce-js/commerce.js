// ---------------------------------------------------------------------------
// Drizzle: Admin activity log queries — append-only writes + paginated reads
// ---------------------------------------------------------------------------

import { and, eq, desc, sql, gte, lte } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { parseFromBound, parseToBound } from '../../date-bounds.js'

export interface InsertActivityEventInput {
  actorId: string | null
  actorEmail: string
  action: string
  entityType: string
  entityId?: string | null
  diff?: unknown
}

export async function insertActivityEvent(input: InsertActivityEventInput) {
  await getDb().insert(schema.activityEvents).values({
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    diff: input.diff == null ? null : (input.diff as any),
  })
}

export interface FindActivityEventsOpts {
  limit: number
  offset: number
  actorId?: string
  entityType?: string
  from?: string
  to?: string
}

export async function findActivityEvents(opts: FindActivityEventsOpts) {
  const db = getDb()
  const conditions: any[] = []

  if (opts.actorId) conditions.push(eq(schema.activityEvents.actorId, opts.actorId))
  if (opts.entityType) conditions.push(eq(schema.activityEvents.entityType, opts.entityType))
  if (opts.from) conditions.push(gte(schema.activityEvents.createdAt, parseFromBound(opts.from)))
  if (opts.to) conditions.push(lte(schema.activityEvents.createdAt, parseToBound(opts.to)))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db.select().from(schema.activityEvents)
      .where(whereClause)
      .orderBy(desc(schema.activityEvents.createdAt))
      .limit(opts.limit)
      .offset(opts.offset),
    db.select({ count: sql<number>`count(*)` })
      .from(schema.activityEvents)
      .where(whereClause),
  ])

  return { rows, total: Number(countResult[0]?.count ?? 0) }
}
