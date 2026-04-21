// ---------------------------------------------------------------------------
// Drizzle: password reset queries (shared admin + buyer)
// ---------------------------------------------------------------------------

import { and, eq, isNull, lt } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function createPasswordResetRow(data: {
  id: string
  actorType: 'admin' | 'buyer'
  actorId: string
  tokenHash: string
  emailSnapshot: string
  expiresAt: Date
}) {
  await getDb().insert(schema.passwordResets).values(data as any)
}

export async function findPasswordResetByTokenHash(tokenHash: string) {
  const [row] = await getDb().select().from(schema.passwordResets)
    .where(eq(schema.passwordResets.tokenHash, tokenHash))
  return row ?? null
}

export async function markPasswordResetUsed(tokenHash: string) {
  const result = await getDb().update(schema.passwordResets)
    .set({ usedAt: new Date() })
    .where(and(
      eq(schema.passwordResets.tokenHash, tokenHash),
      isNull(schema.passwordResets.usedAt),
    ))
    .returning({ id: schema.passwordResets.id })
  return result.length === 1
}

export async function deleteExpiredPasswordResets() {
  const result = await getDb().delete(schema.passwordResets)
    .where(lt(schema.passwordResets.expiresAt, new Date()))
    .returning({ id: schema.passwordResets.id })
  return result.length
}
