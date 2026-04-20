// ---------------------------------------------------------------------------
// Prisma: Staff invite queries
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function createStaffInviteRow(data: {
  id: string
  adminUserId: string
  tokenHash: string
  emailSnapshot: string
  expiresAt: Date
}) {
  return getDb().staffInvite.create({ data })
}

export async function findStaffInviteByTokenHash(tokenHash: string) {
  return getDb().staffInvite.findUnique({ where: { tokenHash } })
}

/**
 * Race-safe single-use mark: returns the row only if `used_at` was still
 * NULL at the time of the update, otherwise null.
 */
export async function markStaffInviteUsed(tokenHash: string) {
  const result = await getDb().staffInvite.updateMany({
    where: { tokenHash, usedAt: null },
    data: { usedAt: new Date() },
  })
  return result.count === 1
}

export async function deleteExpiredStaffInvites() {
  const result = await getDb().staffInvite.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return result.count
}
