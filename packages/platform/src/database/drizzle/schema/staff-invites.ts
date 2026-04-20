// ---------------------------------------------------------------------------
// Staff invites schema — single-use tokens for the email-invite staff flow
// ---------------------------------------------------------------------------

import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'

export const staffInvites = pgTable('staff_invites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  adminUserId: text('admin_user_id').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  emailSnapshot: text('email_snapshot').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  adminUserIdx: index('staff_invites_admin_user_id_idx').on(t.adminUserId),
}))
