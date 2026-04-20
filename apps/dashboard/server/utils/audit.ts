// ---------------------------------------------------------------------------
// audit — thin wrapper around AdminAPI.recordActivity for route handlers
// ---------------------------------------------------------------------------
//
// Reads the current merchant session from the event, snapshots actorId +
// actorEmail at call time (so the audit row survives the actor being
// deleted later), and forwards to admin.recordActivity.
//
// **Fire-and-forget**: audit-write failures must never fail the business
// mutation. Any DB hiccup, missing table, or malformed diff payload gets
// swallowed here. Worst case a single audit row is missing; the commerce
// state stays consistent. (Verified during T13 acceptance by temporarily
// throwing from recordActivity — the originating mutation still returned
// 2xx.)
// ---------------------------------------------------------------------------

import type { H3Event } from 'h3'
import { getMerchantSession } from './merchant-session'

export async function recordActivity(
  event: H3Event,
  action: string,
  entityType: string,
  entityId?: string | null,
  diff?: Record<string, unknown> | null,
): Promise<void> {
  try {
    const admin = event.context.admin
    if (!admin) return
    const session = await getMerchantSession(event)
    await admin.recordActivity({
      actorId: session?.userId ?? null,
      actorEmail: session?.email ?? 'system',
      action,
      entityType,
      entityId: entityId ?? null,
      diff: diff ?? null,
    })
  }
  catch {
    // Fire-and-forget. Never fail the surrounding mutation because of audit.
  }
}
