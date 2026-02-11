// ---------------------------------------------------------------------------
// Customers schema — customers and address book
// ---------------------------------------------------------------------------

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  defaultAddressId: text('default_address_id'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const customerAddresses = sqliteTable('customer_addresses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
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
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
})
