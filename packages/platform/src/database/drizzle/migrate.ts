// ---------------------------------------------------------------------------
// Programmatic migration — creates tables from schema definitions
// ---------------------------------------------------------------------------

import { sql } from 'drizzle-orm'
import type { DrizzleDatabase } from './client.js'

/**
 * Run migrations — creates all tables if they don't exist.
 *
 * Uses `CREATE TABLE IF NOT EXISTS` for idempotent execution.
 * For production migrations, use drizzle-kit instead.
 */
export function migrateDrizzle(db: DrizzleDatabase) {
  db.run(sql`CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    description_ar TEXT,
    image TEXT,
    parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT,
    name TEXT NOT NULL,
    name_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    description_ar TEXT,
    short_description TEXT,
    short_description_ar TEXT,
    price REAL,
    compare_at_price REAL,
    currency TEXT NOT NULL DEFAULT 'SAR',
    product_type TEXT NOT NULL DEFAULT 'physical',
    in_stock INTEGER NOT NULL DEFAULT 1,
    inventory_quantity INTEGER,
    quantity_limit INTEGER,
    vat_included INTEGER NOT NULL DEFAULT 1,
    vat_rate REAL,
    requires_shipping INTEGER NOT NULL DEFAULT 1,
    is_dropshipped INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 0
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT,
    name TEXT,
    name_ar TEXT,
    price REAL,
    compare_at_price REAL,
    in_stock INTEGER NOT NULL DEFAULT 1,
    inventory_quantity INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS product_options (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS product_option_values (
    id TEXT PRIMARY KEY,
    option_id TEXT NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS product_attributes (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    name_ar TEXT,
    value TEXT NOT NULL,
    value_ar TEXT
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS product_categories (
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS product_tags (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    default_address_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS customer_addresses (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    street TEXT NOT NULL,
    street2 TEXT,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL,
    postal_code TEXT,
    district TEXT,
    national_address TEXT,
    additional_number TEXT,
    is_default INTEGER NOT NULL DEFAULT 0
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    coupon_code TEXT,
    shipping_address TEXT,
    billing_address TEXT,
    shipping_method_id TEXT,
    payment_method_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    variant_id TEXT REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    subtotal REAL NOT NULL DEFAULT 0,
    shipping_cost REAL,
    tax REAL,
    discount REAL,
    total REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'SAR',
    shipping_address TEXT,
    billing_address TEXT,
    shipping_method TEXT,
    payment_method TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    note TEXT,
    requires_shipping INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    name TEXT NOT NULL,
    name_ar TEXT,
    image TEXT,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    total_price REAL NOT NULL,
    product_type TEXT NOT NULL DEFAULT 'physical',
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS order_history (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS store_info (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT NOT NULL DEFAULT 'My Store',
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    logo TEXT,
    favicon TEXT,
    currency TEXT NOT NULL DEFAULT 'SAR',
    locale TEXT NOT NULL DEFAULT 'en',
    supported_currencies TEXT DEFAULT '["SAR"]',
    supported_locales TEXT DEFAULT '["en","ar"]',
    timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    social_links TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    logo TEXT,
    description TEXT,
    description_ar TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS countries (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_ar TEXT,
    calling_code TEXT,
    currency TEXT,
    capital TEXT,
    is_active INTEGER NOT NULL DEFAULT 1
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS wishlists (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS wishlist_items (
    id TEXT PRIMARY KEY,
    wishlist_id TEXT NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id TEXT,
    added_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    title TEXT,
    body TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value REAL NOT NULL DEFAULT 0,
    currency TEXT,
    max_discount REAL,
    target TEXT NOT NULL DEFAULT 'order',
    conditions_json TEXT,
    starts_at TEXT NOT NULL,
    ends_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    requires_coupon INTEGER NOT NULL DEFAULT 0,
    usage_limit_per_customer INTEGER,
    usage_limit_total INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    promotion_id TEXT NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    is_valid INTEGER NOT NULL DEFAULT 1,
    invalid_reason TEXT,
    times_used INTEGER NOT NULL DEFAULT 0
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS returns (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    refund_amount REAL,
    refund_currency TEXT,
    refund_method TEXT,
    return_shipping_label TEXT,
    return_tracking_number TEXT,
    merchant_note TEXT,
    customer_note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS return_items (
    id TEXT PRIMARY KEY,
    return_id TEXT NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    order_item_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    name TEXT NOT NULL,
    name_ar TEXT,
    image TEXT,
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT 'other',
    reason_note TEXT
  )`)
}
