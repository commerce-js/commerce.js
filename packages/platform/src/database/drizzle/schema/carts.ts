// ---------------------------------------------------------------------------
// Carts schema — shopping carts and line items
// ---------------------------------------------------------------------------

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { products, productVariants } from './products.js'
import { customers } from './customers.js'

export const carts = sqliteTable('carts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  couponCode: text('coupon_code'),

  // Addresses (stored as JSON for flexibility)
  shippingAddress: text('shipping_address', { mode: 'json' }),
  billingAddress: text('billing_address', { mode: 'json' }),

  // Selected methods
  shippingMethodId: text('shipping_method_id'),
  paymentMethodId: text('payment_method_id'),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const cartItems = sqliteTable('cart_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  cartId: text('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  variantId: text('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
