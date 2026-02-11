// ---------------------------------------------------------------------------
// Store schema — single-row store configuration
// ---------------------------------------------------------------------------

import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const storeInfo = sqliteTable('store_info', {
  id: text('id').primaryKey().default('default'),
  name: text('name').notNull().default('My Store'),
  nameAr: text('name_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  logo: text('logo'),
  favicon: text('favicon'),
  currency: text('currency').notNull().default('SAR'),
  locale: text('locale').notNull().default('en'),
  supportedCurrencies: text('supported_currencies', { mode: 'json' }).$type<string[]>().default(['SAR']),
  supportedLocales: text('supported_locales', { mode: 'json' }).$type<string[]>().default(['en', 'ar']),
  timezone: text('timezone').notNull().default('Asia/Riyadh'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  socialLinks: text('social_links', { mode: 'json' }).$type<Record<string, string>>(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})
