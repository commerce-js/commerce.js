// ---------------------------------------------------------------------------
// Countries schema
// ---------------------------------------------------------------------------

import { pgTable, text, boolean } from 'drizzle-orm/pg-core'

export const countries = pgTable('countries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  callingCode: text('calling_code'),
  currency: text('currency'),
  capital: text('capital'),
  isActive: boolean('is_active').notNull().default(true),
})
