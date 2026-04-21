// ---------------------------------------------------------------------------
// Prisma: password reset queries (shared admin + buyer)
// ---------------------------------------------------------------------------

import { getDb } from '../client.js'

export async function createPasswordResetRow(data: {
  id: string
  actorType: 'admin' | 'buyer'
  actorId: string
  tokenHash: string
  emailSnapshot: string
  expiresAt: Date
}) {
  return getDb().passwordReset.create({ data })
}

export async function findPasswordResetByTokenHash(tokenHash: string) {
  return getDb().passwordReset.findUnique({ where: { tokenHash } })
}

/**
 * Race-safe single-use mark: returns true only if the row's `used_at`
 * was still NULL at the time of the update.
 */
export async function markPasswordResetUsed(tokenHash: string) {
  const result = await getDb().passwordReset.updateMany({
    where: { tokenHash, usedAt: null },
    data: { usedAt: new Date() },
  })
  return result.count === 1
}

export async function deleteExpiredPasswordResets() {
  const result = await getDb().passwordReset.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return result.count
}
