// ---------------------------------------------------------------------------
// Drizzle: Staff invite queries
// ---------------------------------------------------------------------------

import { and, eq, isNull, lt } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function createStaffInviteRow(data: {
  id: string
  adminUserId: string
  tokenHash: string
  emailSnapshot: string
  expiresAt: Date
}) {
  await getDb().insert(schema.staffInvites).values(data as any)
}

export async function findStaffInviteByTokenHash(tokenHash: string) {
  const [row] = await getDb().select().from(schema.staffInvites)
    .where(eq(schema.staffInvites.tokenHash, tokenHash))
  return row ?? null
}

export async function markStaffInviteUsed(tokenHash: string) {
  const result = await getDb().update(schema.staffInvites)
    .set({ usedAt: new Date() })
    .where(and(
      eq(schema.staffInvites.tokenHash, tokenHash),
      isNull(schema.staffInvites.usedAt),
    ))
    .returning({ id: schema.staffInvites.id })
  return result.length === 1
}

export async function deleteExpiredStaffInvites() {
  const result = await getDb().delete(schema.staffInvites)
    .where(lt(schema.staffInvites.expiresAt, new Date()))
    .returning({ id: schema.staffInvites.id })
  return result.length
}
