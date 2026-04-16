// ---------------------------------------------------------------------------
// scripts/seed-merchant.ts
// ---------------------------------------------------------------------------
// One-shot seed script for a CommerceJS Cloud (fly/eaas) merchant.
//
// Reads `.secrets` at the repo root for NEON_CONTROL_DB_URL, looks up the
// target merchant row in the control DB, then opens a `@commercejs/platform`
// adapter against that merchant's Neon branch and creates sample catalog
// data via the admin API.
//
// Usage:
//   pnpm exec tsx scripts/seed-merchant.ts [subdomain]
//
// subdomain defaults to "smoke".
//
// The script is idempotent — products are keyed by SKU, categories by slug;
// anything that already exists is left alone and reported as "skipped".
// ---------------------------------------------------------------------------
/* eslint-disable no-console */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { neon } from '@neondatabase/serverless'
import {
  createPlatformAdapter,
  getDb,
  type PlatformAdapterResult,
} from '@commercejs/platform'
import type { CreateProductInput } from '@commercejs/platform'

// ---------------------------------------------------------------------------
// .secrets loader — intentionally dependency-free (no dotenv).
// Handles `KEY="value"`, `KEY=value`, # comments, blank lines.
// ---------------------------------------------------------------------------

function loadSecrets(path: string): Record<string, string> {
  const raw = readFileSync(path, 'utf8')
  const out: Record<string, string> = {}
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

// ---------------------------------------------------------------------------
// Sample catalog — localized (en/ar), priced in SAR, with placeholder images.
// ---------------------------------------------------------------------------

interface SampleProduct extends CreateProductInput {
  // CreateProductInput doesn't require any of these, we just ensure we
  // always set SKU + slug so idempotency checks are deterministic.
  sku: string
  slug: string
}

// ---------------------------------------------------------------------------
// GCC country reference data — seeded into the merchant `countries` table
// so the checkout address form's dropdown has options. The static flag/iso3
// enrichment is added by the storefront handler (apps/dashboard/server/data/geo.ts),
// so we only persist the core columns the Country model defines.
// ---------------------------------------------------------------------------
const SAMPLE_COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', callingCode: '+966', currency: 'SAR', capital: 'Riyadh' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', callingCode: '+971', currency: 'AED', capital: 'Abu Dhabi' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', callingCode: '+973', currency: 'BHD', capital: 'Manama' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', callingCode: '+965', currency: 'KWD', capital: 'Kuwait City' },
  { code: 'OM', name: 'Oman', nameAr: 'عُمان', callingCode: '+968', currency: 'OMR', capital: 'Muscat' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', callingCode: '+974', currency: 'QAR', capital: 'Doha' },
] as const

const SAMPLE_CATEGORY = {
  name: 'Featured',
  nameAr: 'المميزة',
  slug: 'featured',
  description: 'Hand-picked products for the storefront smoke test',
  descriptionAr: 'منتجات مختارة لاختبار الواجهة',
}

const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    sku: 'SMK-001',
    slug: 'oud-cologne-amber',
    name: 'Oud Cologne — Amber',
    nameAr: 'كولونيا العود — العنبر',
    description: 'A warm oud-forward fragrance with amber and sandalwood notes.',
    descriptionAr: 'عطر دافئ مستوحى من العود مع العنبر وخشب الصندل.',
    shortDescription: 'Warm oud, amber, sandalwood — 50ml.',
    shortDescriptionAr: 'عود دافئ، عنبر، خشب الصندل — ٥٠ مل.',
    price: 249,
    currency: 'SAR',
    inventoryQuantity: 50,
    inStock: true,
    status: 'active',
    vatIncluded: true,
    vatRate: 15,
    requiresShipping: true,
    images: [
      {
        url: 'https://picsum.photos/seed/smk-001/800/800',
        altText: 'Oud Cologne Amber bottle',
        isPrimary: true,
      },
    ],
    tags: ['fragrance', 'oud', 'featured'],
  },
  {
    sku: 'SMK-002',
    slug: 'arabic-coffee-premium',
    name: 'Premium Arabic Coffee',
    nameAr: 'قهوة عربية فاخرة',
    description: 'Single-origin Arabic coffee, medium roast, 250g whole bean.',
    descriptionAr: 'قهوة عربية من مصدر واحد، تحميص متوسط، ٢٥٠ جرام حبوب كاملة.',
    shortDescription: 'Medium roast, 250g whole bean.',
    shortDescriptionAr: 'تحميص متوسط، ٢٥٠ جرام.',
    price: 89,
    compareAtPrice: 109,
    currency: 'SAR',
    inventoryQuantity: 120,
    inStock: true,
    status: 'active',
    vatIncluded: true,
    vatRate: 15,
    requiresShipping: true,
    images: [
      {
        url: 'https://picsum.photos/seed/smk-002/800/800',
        altText: 'Bag of Arabic coffee beans',
        isPrimary: true,
      },
    ],
    tags: ['coffee', 'featured'],
  },
  {
    sku: 'SMK-003',
    slug: 'dates-medjool-1kg',
    name: 'Medjool Dates — 1kg',
    nameAr: 'تمر مجدول — كيلو',
    description: 'Premium Medjool dates, naturally sweet and soft.',
    descriptionAr: 'تمر مجدول فاخر، حلو وطري بشكل طبيعي.',
    shortDescription: '1kg box of Medjool dates.',
    shortDescriptionAr: 'علبة ١ كيلو تمر مجدول.',
    price: 129,
    currency: 'SAR',
    inventoryQuantity: 80,
    inStock: true,
    status: 'active',
    vatIncluded: true,
    vatRate: 15,
    requiresShipping: true,
    images: [
      {
        url: 'https://picsum.photos/seed/smk-003/800/800',
        altText: 'Box of Medjool dates',
        isPrimary: true,
      },
    ],
    tags: ['food', 'dates'],
  },
  {
    sku: 'SMK-004',
    slug: 'prayer-rug-embroidered',
    name: 'Embroidered Prayer Rug',
    nameAr: 'سجادة صلاة مطرزة',
    description: 'Hand-embroidered prayer rug with a gold compass emblem.',
    descriptionAr: 'سجادة صلاة مطرزة يدويًا مع شعار البوصلة الذهبية.',
    shortDescription: 'Hand-embroidered, 120×70cm.',
    shortDescriptionAr: 'مطرزة يدويًا، ١٢٠×٧٠ سم.',
    price: 199,
    currency: 'SAR',
    inventoryQuantity: 30,
    inStock: true,
    status: 'active',
    vatIncluded: true,
    vatRate: 15,
    requiresShipping: true,
    images: [
      {
        url: 'https://picsum.photos/seed/smk-004/800/800',
        altText: 'Embroidered prayer rug',
        isPrimary: true,
      },
    ],
    tags: ['home', 'islamic'],
  },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const subdomain = process.argv[2] ?? 'smoke'

  const here = dirname(fileURLToPath(import.meta.url))
  const repoRoot = resolve(here, '..')
  const secrets = loadSecrets(resolve(repoRoot, '.secrets'))

  const controlUrl = secrets.NEON_CONTROL_DB_URL ?? process.env.NEON_CONTROL_DB_URL
  if (!controlUrl) {
    throw new Error('NEON_CONTROL_DB_URL missing — expected in .secrets or env')
  }

  // -------------------------------------------------------------------------
  // 1. Look up the merchant in the control DB.
  // -------------------------------------------------------------------------
  console.log(`[seed] looking up merchant "${subdomain}" in control DB…`)
  const sql = neon(controlUrl)
  const rows = (await sql`
    SELECT id, subdomain, database_url, name, currency, status
    FROM merchants
    WHERE subdomain = ${subdomain}
    LIMIT 1
  `) as Array<{
    id: string
    subdomain: string
    database_url: string | null
    name: string
    currency: string
    status: string
  }>

  if (rows.length === 0) {
    throw new Error(`No merchant with subdomain "${subdomain}" in control DB`)
  }
  const merchant = rows[0]
  if (!merchant.database_url) {
    throw new Error(
      `Merchant "${subdomain}" has no database_url (status=${merchant.status}). `
      + 'Provisioning may not be complete yet.',
    )
  }
  console.log(`[seed] found merchant ${merchant.name} (${merchant.id}), status=${merchant.status}`)

  // -------------------------------------------------------------------------
  // 2. Open platform adapter against the merchant's Neon branch.
  // -------------------------------------------------------------------------
  console.log(`[seed] opening platform adapter against merchant DB…`)
  const { adapter, admin }: PlatformAdapterResult = await createPlatformAdapter({
    connectionString: merchant.database_url,
    currency: merchant.currency || 'SAR',
  })

  // -------------------------------------------------------------------------
  // 3. Seed GCC countries so the checkout address form has something to
  //    show. Idempotent: upsert-by-code.
  // -------------------------------------------------------------------------
  console.log(`[seed] seeding GCC countries…`)
  const prisma = getDb()
  let countriesCreated = 0
  let countriesSkipped = 0
  for (const c of SAMPLE_COUNTRIES) {
    const existing = await prisma.country.findUnique({ where: { code: c.code } })
    if (existing) {
      countriesSkipped++
      continue
    }
    await prisma.country.create({
      data: {
        code: c.code,
        name: c.name,
        nameAr: c.nameAr,
        callingCode: c.callingCode,
        currency: c.currency,
        capital: c.capital,
        isActive: true,
      },
    })
    console.log(`[seed]   created country ${c.code} (${c.name})`)
    countriesCreated++
  }
  console.log(`[seed] countries: created ${countriesCreated}, skipped ${countriesSkipped}`)

  // -------------------------------------------------------------------------
  // 4. Ensure the "Featured" category exists — look up by slug first.
  // -------------------------------------------------------------------------
  console.log(`[seed] ensuring category "${SAMPLE_CATEGORY.slug}"…`)
  const existingCategories = await adapter.getCategories()
  let featuredId: string
  const hit = existingCategories.find(c => c.slug === SAMPLE_CATEGORY.slug)
  if (hit) {
    featuredId = hit.id
    console.log(`[seed]   skip (exists) id=${featuredId}`)
  }
  else {
    const created = await admin.createCategory({
      name: SAMPLE_CATEGORY.name,
      nameAr: SAMPLE_CATEGORY.nameAr,
      slug: SAMPLE_CATEGORY.slug,
      description: SAMPLE_CATEGORY.description,
      descriptionAr: SAMPLE_CATEGORY.descriptionAr,
    })
    featuredId = created.id
    console.log(`[seed]   created id=${featuredId}`)
  }

  // -------------------------------------------------------------------------
  // 5. Seed each product — skip if SKU already present.
  // -------------------------------------------------------------------------
  let created = 0
  let skipped = 0

  for (const product of SAMPLE_PRODUCTS) {
    const existing = await admin.listProducts({ search: product.sku, perPage: 5 })
    // listProducts search is a substring match on name+sku, so confirm exact SKU.
    const already = existing.items.find(p => p.sku === product.sku)
    if (already) {
      console.log(`[seed] skip product ${product.sku} (exists id=${already.id})`)
      skipped++
      continue
    }

    // Assign the first two products to the Featured category so the
    // category page has content.
    const categories = (product.sku === 'SMK-001' || product.sku === 'SMK-002')
      ? [featuredId]
      : undefined

    const result = await admin.createProduct({ ...product, categories })
    console.log(
      `[seed] created ${product.sku} id=${result.id} slug=${result.slug} `
      + `price=${product.price} ${product.currency}`,
    )
    created++
  }

  console.log(`\n[seed] done — created ${created}, skipped ${skipped}, total ${SAMPLE_PRODUCTS.length}`)
  console.log(`[seed] verify: https://${subdomain}.commercejs.cloud/api/storefront/products`)

  // Let any pending connections close gracefully.
  process.exit(0)
}

main().catch((err) => {
  console.error('[seed] failed:', err)
  process.exit(1)
})
