// ---------------------------------------------------------------------------
// Admin Users schema — store administrators
// ---------------------------------------------------------------------------

import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const adminUsers = pgTable('admin_users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  /** NULL for rows in the 'invited' state (pre-accept). */
  passwordHash: text('password_hash'),
  name: text('name'),
  role: text('role').notNull().default('admin'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
