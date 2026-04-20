// ---------------------------------------------------------------------------
// Prisma: Admin activity log queries — append-only writes + paginated reads
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'
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
  return getDb().activityEvent.create({
    data: {
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      diff: input.diff == null ? null : (input.diff as any),
    },
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
  const prisma = getDb()
  const where: any = {}

  if (opts.actorId) where.actorId = opts.actorId
  if (opts.entityType) where.entityType = opts.entityType
  if (opts.from || opts.to) {
    where.createdAt = {}
    if (opts.from) where.createdAt.gte = parseFromBound(opts.from)
    if (opts.to) where.createdAt.lte = parseToBound(opts.to)
  }

  const [rows, total] = await Promise.all([
    prisma.activityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts.limit,
      skip: opts.offset,
    }),
    prisma.activityEvent.count({ where }),
  ])

  return { rows, total }
}
