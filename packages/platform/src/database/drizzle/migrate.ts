// ---------------------------------------------------------------------------
// Programmatic migration — creates tables using drizzle-kit push
// ---------------------------------------------------------------------------
// For production use, run `npx drizzle-kit push` or `npx drizzle-kit migrate`
// from the packages/platform directory.
//
// This module exports a helper for programmatic migration during server startup.

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { sql } from 'drizzle-orm'

/**
 * Run migrations — creates all tables if they don't exist.
 *
 * Uses `CREATE TABLE IF NOT EXISTS` for idempotent execution.
 * For production schema evolution, use drizzle-kit migrations.
 */
export async function migrateDrizzle(connectionString?: string) {
  let db: ReturnType<typeof drizzle>

  if (connectionString) {
    const client = neon(connectionString)
    db = drizzle({ client })
  } else {
    // Import the existing db instance
    const { getDb } = await import('./client.js')
    db = getDb() as any
  }

  // Enable UUID extension
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    description_ar TEXT,
    image TEXT,
    parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT,
    name TEXT NOT NULL,
    name_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    description_ar TEXT,
    short_description TEXT,
    short_description_ar TEXT,
    price NUMERIC(12, 2),
    compare_at_price NUMERIC(12, 2),
    currency TEXT NOT NULL DEFAULT 'SAR',
    product_type TEXT NOT NULL DEFAULT 'physical',
    in_stock BOOLEAN NOT NULL DEFAULT true,
    inventory_quantity INTEGER,
    quantity_limit INTEGER,
    vat_included BOOLEAN NOT NULL DEFAULT true,
    vat_rate DOUBLE PRECISION,
    requires_shipping BOOLEAN NOT NULL DEFAULT true,
    is_dropshipped BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT,
    name TEXT,
    name_ar TEXT,
    price NUMERIC(12, 2),
    compare_at_price NUMERIC(12, 2),
    in_stock BOOLEAN NOT NULL DEFAULT true,
    inventory_quantity INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_options (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_option_values (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id TEXT NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_attributes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    name_ar TEXT,
    value TEXT NOT NULL,
    value_ar TEXT
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_categories (
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_tags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag TEXT NOT NULL
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    default_address_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS customer_addresses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
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
    is_default BOOLEAN NOT NULL DEFAULT false
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    coupon_code TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    shipping_method_id TEXT,
    payment_method_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    variant_id TEXT REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(12, 2),
    tax NUMERIC(12, 2),
    discount NUMERIC(12, 2),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'SAR',
    shipping_address JSONB,
    billing_address JSONB,
    shipping_method TEXT,
    payment_method TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    note TEXT,
    requires_shipping BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    name TEXT NOT NULL,
    name_ar TEXT,
    image TEXT,
    quantity INTEGER NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    product_type TEXT NOT NULL DEFAULT 'physical',
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS order_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS store_info (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT NOT NULL DEFAULT 'My Store',
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    logo TEXT,
    favicon TEXT,
    currency TEXT NOT NULL DEFAULT 'SAR',
    locale TEXT NOT NULL DEFAULT 'en',
    supported_currencies JSONB DEFAULT '["SAR"]',
    supported_locales JSONB DEFAULT '["en","ar"]',
    timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    social_links JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    slug TEXT NOT NULL UNIQUE,
    logo TEXT,
    description TEXT,
    description_ar TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS countries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_ar TEXT,
    calling_code TEXT,
    currency TEXT,
    capital TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS wishlists (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS wishlist_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id TEXT NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id TEXT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    title TEXT,
    body TEXT,
    verified BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT,
    max_discount NUMERIC(12, 2),
    target TEXT NOT NULL DEFAULT 'order',
    conditions_json TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    requires_coupon BOOLEAN NOT NULL DEFAULT false,
    usage_limit_per_customer INTEGER,
    usage_limit_total INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    promotion_id TEXT NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    invalid_reason TEXT,
    times_used INTEGER NOT NULL DEFAULT 0
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS returns (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    refund_amount NUMERIC(12, 2),
    refund_currency TEXT,
    refund_method TEXT,
    return_shipping_label TEXT,
    return_tracking_number TEXT,
    merchant_note TEXT,
    customer_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS return_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
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

  await db.execute(sql`CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  // Profile tables — cross-merchant buyer identity
  await db.execute(sql`CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    preferences JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS profile_addresses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label TEXT,
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
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS profile_payment_methods (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    type TEXT NOT NULL,
    last4 TEXT NOT NULL,
    brand TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    provider_token TEXT,
    billing_address JSONB,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS profile_merchant_links (
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    merchant_id TEXT NOT NULL,
    adapter_customer_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (profile_id, merchant_id)
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS profile_otp_codes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'email',
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  // Integrations — stores provider credentials (e.g. Armada access tokens)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS integrations (
    provider TEXT PRIMARY KEY,
    access_token TEXT,
    config JSONB,
    status TEXT NOT NULL DEFAULT 'disconnected',
    connected_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
}
