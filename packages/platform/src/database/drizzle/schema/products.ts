// ---------------------------------------------------------------------------
// Products schema — products, variants, images, options, attributes
// ---------------------------------------------------------------------------

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { categories } from './categories.js'

// ---- Products ----

export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sku: text('sku'),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  descriptionAr: text('description_ar'),
  shortDescription: text('short_description'),
  shortDescriptionAr: text('short_description_ar'),

  // Pricing
  price: real('price'),
  compareAtPrice: real('compare_at_price'),
  currency: text('currency').notNull().default('SAR'),

  // Classification
  productType: text('product_type', {
    enum: ['physical', 'digital', 'service', 'event', 'subscription', 'auction', 'rental', 'gift_card'],
  }).notNull().default('physical'),

  // Stock
  inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true),
  inventoryQuantity: integer('inventory_quantity'),
  quantityLimit: integer('quantity_limit'),

  // Flags
  vatIncluded: integer('vat_included', { mode: 'boolean' }).notNull().default(true),
  vatRate: real('vat_rate'),
  requiresShipping: integer('requires_shipping', { mode: 'boolean' }).notNull().default(true),
  isDropshipped: integer('is_dropshipped', { mode: 'boolean' }).notNull().default(false),

  // Status
  status: text('status', { enum: ['active', 'draft', 'archived'] }).notNull().default('draft'),

  // Timestamps
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ---- Product Images ----

export const productImages = sqliteTable('product_images', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
})

// ---- Product Variants ----

export const productVariants = sqliteTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: text('sku'),
  name: text('name'),
  nameAr: text('name_ar'),
  price: real('price'),
  compareAtPrice: real('compare_at_price'),
  inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true),
  inventoryQuantity: integer('inventory_quantity'),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ---- Product Options (e.g., Size, Color) ----

export const productOptions = sqliteTable('product_options', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ---- Product Option Values (e.g., S, M, L, XL) ----

export const productOptionValues = sqliteTable('product_option_values', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  optionId: text('option_id').notNull().references(() => productOptions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ---- Product Attributes (key-value metadata) ----

export const productAttributes = sqliteTable('product_attributes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  value: text('value').notNull(),
  valueAr: text('value_ar'),
})

// ---- Product ↔ Category (many-to-many) ----

export const productCategories = sqliteTable('product_categories', {
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
})

// ---- Product Tags ----

export const productTags = sqliteTable('product_tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
})
