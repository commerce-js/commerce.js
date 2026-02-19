// ---------------------------------------------------------------------------
// Prisma: Programmatic migration — creates tables (PostgreSQL syntax)
// ---------------------------------------------------------------------------

import { getDb } from './client.js'

/**
 * Run migrations — creates all tables if they don't exist.
 *
 * Uses raw SQL with PostgreSQL-compatible syntax via $executeRawUnsafe.
 * For production, prefer `prisma migrate deploy` via the CLI.
 */
export async function migratePrisma() {
  const prisma = getDb()

  const statements = [
    `CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      name_ar TEXT,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      description_ar TEXT,
      image TEXT,
      parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sku TEXT,
      name TEXT NOT NULL,
      name_ar TEXT,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      description_ar TEXT,
      short_description TEXT,
      short_description_ar TEXT,
      price DECIMAL(12,2),
      compare_at_price DECIMAL(12,2),
      currency TEXT NOT NULL DEFAULT 'SAR',
      product_type TEXT NOT NULL DEFAULT 'physical',
      in_stock BOOLEAN NOT NULL DEFAULT true,
      inventory_quantity INTEGER,
      quantity_limit INTEGER,
      vat_included BOOLEAN NOT NULL DEFAULT true,
      vat_rate DECIMAL(5,2),
      requires_shipping BOOLEAN NOT NULL DEFAULT true,
      is_dropshipped BOOLEAN NOT NULL DEFAULT false,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS product_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      alt_text TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_primary BOOLEAN NOT NULL DEFAULT false
    )`,

    `CREATE TABLE IF NOT EXISTS product_variants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      sku TEXT,
      name TEXT,
      name_ar TEXT,
      price DECIMAL(12,2),
      compare_at_price DECIMAL(12,2),
      in_stock BOOLEAN NOT NULL DEFAULT true,
      inventory_quantity INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS product_options (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      name_ar TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS product_option_values (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      name_ar TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS product_attributes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      name_ar TEXT,
      value TEXT NOT NULL,
      value_ar TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS product_categories (
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, category_id)
    )`,

    `CREATE TABLE IF NOT EXISTS product_tags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      tag TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      default_address_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS customer_addresses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
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
    )`,

    `CREATE TABLE IF NOT EXISTS carts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      coupon_code TEXT,
      shipping_address JSONB,
      billing_address JSONB,
      shipping_method_id TEXT,
      payment_method_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS cart_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id),
      variant_id UUID REFERENCES product_variants(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number TEXT NOT NULL UNIQUE,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      shipping_cost DECIMAL(12,2),
      tax DECIMAL(12,2),
      discount DECIMAL(12,2),
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
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
    )`,

    `CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      name TEXT NOT NULL,
      name_ar TEXT,
      image TEXT,
      quantity INTEGER NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      total_price DECIMAL(12,2) NOT NULL,
      product_type TEXT NOT NULL DEFAULT 'physical',
      fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'
    )`,

    `CREATE TABLE IF NOT EXISTS order_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS store_info (
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
    )`,

    `CREATE TABLE IF NOT EXISTS brands (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      name_ar TEXT,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      description TEXT,
      description_ar TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS countries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      name_ar TEXT,
      calling_code TEXT,
      currency TEXT,
      capital TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true
    )`,

    `CREATE TABLE IF NOT EXISTS wishlists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS wishlist_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_id UUID,
      added_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT,
      body TEXT,
      verified BOOLEAN NOT NULL DEFAULT false,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS promotions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      name_ar TEXT,
      description TEXT,
      description_ar TEXT,
      discount_type TEXT NOT NULL DEFAULT 'percentage',
      discount_value DECIMAL(12,2) NOT NULL DEFAULT 0,
      currency TEXT,
      max_discount DECIMAL(12,2),
      target TEXT NOT NULL DEFAULT 'order',
      conditions_json JSONB,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT true,
      requires_coupon BOOLEAN NOT NULL DEFAULT false,
      usage_limit_per_customer INTEGER,
      usage_limit_total INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS coupons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
      is_valid BOOLEAN NOT NULL DEFAULT true,
      invalid_reason TEXT,
      times_used INTEGER NOT NULL DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS returns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      order_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'requested',
      refund_amount DECIMAL(12,2),
      refund_currency TEXT,
      refund_method TEXT,
      return_shipping_label TEXT,
      return_tracking_number TEXT,
      merchant_note TEXT,
      customer_note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS return_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
      order_item_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      name TEXT NOT NULL,
      name_ar TEXT,
      image TEXT,
      quantity INTEGER NOT NULL,
      reason TEXT NOT NULL DEFAULT 'other',
      reason_note TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  ]

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt)
  }
}
