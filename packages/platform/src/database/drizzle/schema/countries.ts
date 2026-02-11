// ---------------------------------------------------------------------------
// Countries schema
// ---------------------------------------------------------------------------

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const countries = sqliteTable('countries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  callingCode: text('calling_code'),
  currency: text('currency'),
  capital: text('capital'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
})
