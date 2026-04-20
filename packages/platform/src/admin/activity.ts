// ---------------------------------------------------------------------------
// Admin: Activity log — append-only audit trail of merchant admin actions
// ---------------------------------------------------------------------------
//
// Domain wrapper around insertActivityEvent / findActivityEvents. Writes are
// append-only; never read-modify-write. Reads are paginated and filter on
// actorId, entityType, and a from/to date range (reuses parseFromBound /
// parseToBound at the query layer).
// ---------------------------------------------------------------------------

import type { PaginatedResult } from '@commercejs/types'
import {
  insertActivityEvent,
  findActivityEvents,
} from '../database/index.js'
import type {
  ActivityEvent,
  RecordActivityInput,
  ListActivityParams,
} from './types.js'

const DEFAULT_PER_PAGE = 50
const MAX_PER_PAGE = 200

function mapActivityEvent(row: any): ActivityEvent {
  const createdAt = row.createdAt instanceof Date
    ? row.createdAt.toISOString()
    : String(row.createdAt)
  return {
    id: row.id,
    actorId: row.actorId ?? null,
    actorEmail: row.actorEmail,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId ?? null,
    diff: row.diff == null ? null : (row.diff as Record<string, unknown>),
    createdAt,
  }
}

export function createAdminActivityDomain() {
  return {
    async recordActivity(input: RecordActivityInput): Promise<void> {
      await insertActivityEvent({
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        diff: input.diff ?? null,
      })
    },

    async listActivity(params?: ListActivityParams): Promise<PaginatedResult<ActivityEvent>> {
      const page = Math.max(params?.page ?? 1, 1)
      const perPageRaw = params?.perPage ?? DEFAULT_PER_PAGE
      const perPage = Math.min(Math.max(perPageRaw, 1), MAX_PER_PAGE)
      const offset = (page - 1) * perPage

      const { rows, total } = await findActivityEvents({
        limit: perPage,
        offset,
        actorId: params?.actorId,
        entityType: params?.entityType,
        from: params?.from,
        to: params?.to,
      })

      return {
        items: rows.map(mapActivityEvent),
        total,
        page,
        perPage,
        hasMore: offset + perPage < total,
      }
    },
  }
}
