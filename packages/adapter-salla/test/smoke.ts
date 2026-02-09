#!/usr/bin/env npx tsx
// ---------------------------------------------------------------------------
// Integration test — validates SallaAdapter against a real Salla store
//
// Usage:
//   1. Add your token to packages/adapter-salla/.env
//   2. npx tsx packages/adapter-salla/test/smoke.ts
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env from the package root
const envPath = resolve(import.meta.dirname ?? __dirname, '..', '.env')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  }
} catch { /* .env is optional */ }

import { SallaAdapter } from '../src/index'

const token = process.env.SALLA_TOKEN
if (!token) {
  console.error('❌ Set SALLA_TOKEN env variable first')
  process.exit(1)
}

const adapter = new SallaAdapter({ accessToken: token, locale: 'ar' })

async function run() {
  const results: Array<{ test: string; status: '✅' | '❌'; detail: string }> = []

  // 1. Store Info
  try {
    const store = await adapter.getStoreInfo()
    results.push({ test: 'getStoreInfo', status: '✅', detail: `Store: "${store.name.ar || store.name.en}" — ${store.currencies.length} currencies` })
  } catch (e: any) {
    results.push({ test: 'getStoreInfo', status: '❌', detail: e.message })
  }

  // 2. Categories
  try {
    const cats = await adapter.getCategories()
    results.push({ test: 'getCategories', status: '✅', detail: `${cats.length} categories` })
  } catch (e: any) {
    results.push({ test: 'getCategories', status: '❌', detail: e.message })
  }

  // 3. Products (first page)
  let firstProductId: string | null = null
  try {
    const search = await adapter.getProducts({ page: 1, perPage: 5 })
    firstProductId = search.products.items[0]?.id ?? null
    results.push({ test: 'getProducts', status: '✅', detail: `${search.products.total} total, fetched ${search.products.items.length}` })
  } catch (e: any) {
    results.push({ test: 'getProducts', status: '❌', detail: e.message })
  }

  // 4. Single Product
  if (firstProductId) {
    try {
      const product = await adapter.getProduct({ id: firstProductId })
      const name = product.name.ar || product.name.en
      results.push({ test: 'getProduct', status: '✅', detail: `"${name}" — ${product.variants.length} variants, inStock=${product.inStock}` })
    } catch (e: any) {
      results.push({ test: 'getProduct', status: '❌', detail: e.message })
    }
  }

  // 5. Product Reviews
  if (firstProductId) {
    try {
      const reviews = await adapter.getProductReviews(firstProductId, { page: 1, perPage: 5 })
      results.push({ test: 'getProductReviews', status: '✅', detail: `${reviews.total} reviews` })
    } catch (e: any) {
      results.push({ test: 'getProductReviews', status: '❌', detail: e.message })
    }
  }

  // 6. Orders
  try {
    const orders = await adapter.getCustomerOrders({ page: 1, perPage: 5 })
    results.push({ test: 'getCustomerOrders', status: '✅', detail: `${orders.total} orders` })
  } catch (e: any) {
    results.push({ test: 'getCustomerOrders', status: '❌', detail: e.message })
  }

  // 7. Shipping Methods
  try {
    const methods = await adapter.getShippingMethods('_')
    results.push({ test: 'getShippingMethods', status: '✅', detail: `${methods.length} shipping companies` })
  } catch (e: any) {
    results.push({ test: 'getShippingMethods', status: '❌', detail: e.message })
  }

  // 8. Payment Methods
  try {
    const payments = await adapter.getPaymentMethods('_')
    results.push({ test: 'getPaymentMethods', status: '✅', detail: `${payments.length} payment methods` })
  } catch (e: any) {
    results.push({ test: 'getPaymentMethods', status: '❌', detail: e.message })
  }

  // 9. Coupons / Promotions
  try {
    const promos = await adapter.getActivePromotions()
    results.push({ test: 'getActivePromotions', status: '✅', detail: `${promos.length} active promotions` })
  } catch (e: any) {
    results.push({ test: 'getActivePromotions', status: '❌', detail: e.message })
  }

  // 10. Brands
  try {
    const brands = await adapter.getBrands()
    results.push({ test: 'getBrands', status: '✅', detail: `${brands.length} brands` })
  } catch (e: any) {
    results.push({ test: 'getBrands', status: '❌', detail: e.message })
  }

  // 11. Countries
  try {
    const countries = await adapter.getCountries()
    results.push({ test: 'getCountries', status: '✅', detail: `${countries.length} countries` })
  } catch (e: any) {
    results.push({ test: 'getCountries', status: '❌', detail: e.message })
  }

  // 12. Store Locations / Branches
  try {
    const locations = await adapter.getStoreLocations()
    const names = locations.map(l => l.name.ar || l.name.en).join(', ')
    results.push({ test: 'getStoreLocations', status: '✅', detail: `${locations.length} locations (${names})` })
  } catch (e: any) {
    results.push({ test: 'getStoreLocations', status: '❌', detail: e.message })
  }

  // ---- Print Results ----
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Salla Adapter — Integration Test')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  for (const r of results) {
    console.log(`  ${r.status}  ${r.test.padEnd(22)} ${r.detail}`)
  }

  const passed = results.filter(r => r.status === '✅').length
  const failed = results.filter(r => r.status === '❌').length
  console.log(`\n  ${passed} passed · ${failed} failed\n`)
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
