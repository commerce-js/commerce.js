// ---------------------------------------------------------------------------
// Profiles schema — cross-merchant buyer identity
// ---------------------------------------------------------------------------

import { pgTable, text, integer, boolean, timestamp, jsonb, primaryKey } from 'drizzle-orm/pg-core'

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique(),
  phone: text('phone'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  preferences: jsonb('preferences'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const profileAddresses = pgTable('profile_addresses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  label: text('label'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  street: text('street').notNull(),
  street2: text('street2'),
  city: text('city').notNull(),
  state: text('state'),
  country: text('country').notNull(),
  postalCode: text('postal_code'),
  district: text('district'),
  nationalAddress: text('national_address'),
  additionalNumber: text('additional_number'),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const profilePaymentMethods = pgTable('profile_payment_methods', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  type: text('type').notNull(),
  last4: text('last4').notNull(),
  brand: text('brand'),
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  /** Encrypted provider token — NEVER exposed via API */
  providerToken: text('provider_token'),
  billingAddress: jsonb('billing_address'),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const profileMerchantLinks = pgTable('profile_merchant_links', {
  profileId: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  merchantId: text('merchant_id').notNull(),
  adapterCustomerId: text('adapter_customer_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.profileId, table.merchantId] }),
])

export const profileOtpCodes = pgTable('profile_otp_codes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  channel: text('channel').notNull().default('email'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verified: boolean('verified').notNull().default(false),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
