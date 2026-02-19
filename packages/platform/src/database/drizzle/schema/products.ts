// ---------------------------------------------------------------------------
// Products schema — products, variants, images, options, attributes
// ---------------------------------------------------------------------------

import { pgTable, text, integer, boolean, numeric, doublePrecision, timestamp } from 'drizzle-orm/pg-core'
import { categories } from './categories.js'

// ---- Products ----

export const products = pgTable('products', {
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
  price: numeric('price', { precision: 12, scale: 2 }),
  compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 2 }),
  currency: text('currency').notNull().default('SAR'),

  // Classification
  productType: text('product_type').notNull().default('physical'),

  // Stock
  inStock: boolean('in_stock').notNull().default(true),
  inventoryQuantity: integer('inventory_quantity'),
  quantityLimit: integer('quantity_limit'),

  // Flags
  vatIncluded: boolean('vat_included').notNull().default(true),
  vatRate: doublePrecision('vat_rate'),
  requiresShipping: boolean('requires_shipping').notNull().default(true),
  isDropshipped: boolean('is_dropshipped').notNull().default(false),

  // Status
  status: text('status').notNull().default('draft'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---- Product Images ----

export const productImages = pgTable('product_images', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
})

// ---- Product Variants ----

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: text('sku'),
  name: text('name'),
  nameAr: text('name_ar'),
  price: numeric('price', { precision: 12, scale: 2 }),
  compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 2 }),
  inStock: boolean('in_stock').notNull().default(true),
  inventoryQuantity: integer('inventory_quantity'),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ---- Product Options (e.g., Size, Color) ----

export const productOptions = pgTable('product_options', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ---- Product Option Values (e.g., S, M, L, XL) ----

export const productOptionValues = pgTable('product_option_values', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  optionId: text('option_id').notNull().references(() => productOptions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ---- Product Attributes (key-value metadata) ----

export const productAttributes = pgTable('product_attributes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  value: text('value').notNull(),
  valueAr: text('value_ar'),
})

// ---- Product ↔ Category (many-to-many) ----

export const productCategories = pgTable('product_categories', {
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
})

// ---- Product Tags ----

export const productTags = pgTable('product_tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
})
