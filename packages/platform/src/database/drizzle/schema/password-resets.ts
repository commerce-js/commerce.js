// ---------------------------------------------------------------------------
// Password resets schema — shared admin + buyer token table
// ---------------------------------------------------------------------------

import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'

export const passwordResets = pgTable('password_resets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorType: text('actor_type').notNull(),
  actorId: text('actor_id').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  emailSnapshot: text('email_snapshot').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  actorIdx: index('password_resets_actor_idx').on(t.actorType, t.actorId),
}))
