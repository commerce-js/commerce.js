// ---------------------------------------------------------------------------
// Admin Users schema — store administrators
// ---------------------------------------------------------------------------

import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role', { enum: ['owner', 'admin', 'editor'] }).notNull().default('admin'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})
