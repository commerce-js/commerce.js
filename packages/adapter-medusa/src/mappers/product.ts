// ---------------------------------------------------------------------------
// Product mapper — MedusaProduct → Commerce.js Product
// ---------------------------------------------------------------------------

import type { Product, ProductVariant, ProductOption, Attribute, Category, Image, DiscountablePrice } from '@commercejs/types'
import type { MedusaProduct, MedusaProductVariant, MedusaProductCategory } from '../types.js'
import { mapMedusaCategory } from './category.js'

/** Build a localized string from a plain string (Medusa doesn't do i18n by default) */
function localized(value: string | null | undefined): { ar: string; en: string } {
  return { ar: value ?? '', en: value ?? '' }
}

/** Convert Medusa price (minor units) to Commerce.js Price */
function toPrice(amount: number, currency: string): DiscountablePrice {
  return {
    amount,
    currency: currency.toUpperCase(),
    formatted: `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`,
  }
}

/** Map a single Medusa variant to Commerce.js ProductVariant */
function mapVariant(v: MedusaProductVariant, currency: string): ProductVariant {
  const calculatedPrice = v.calculated_price
  const price = calculatedPrice
    ? {
        ...toPrice(calculatedPrice.calculated_amount, calculatedPrice.currency_code),
        originalAmount: calculatedPrice.original_amount !== calculatedPrice.calculated_amount
          ? calculatedPrice.original_amount
          : undefined,
        discountPercent: calculatedPrice.original_amount > 0 && calculatedPrice.original_amount !== calculatedPrice.calculated_amount
          ? Math.round((1 - calculatedPrice.calculated_amount / calculatedPrice.original_amount) * 100)
          : undefined,
      }
    : v.prices?.[0]
      ? toPrice(v.prices[0].amount, v.prices[0].currency_code)
      : null

  const attributes: Attribute[] = (v.options ?? []).map(opt => ({
    code: opt.option_id,
    name: localized(opt.option?.title ?? opt.option_id),
    value: localized(opt.value),
  }))

  return {
    id: v.id,
    sku: v.sku ?? null,
    name: localized(v.title),
    price,
    attributes,
    inStock: v.allow_backorder || (v.inventory_quantity ?? 0) > 0,
    inventoryQuantity: v.manage_inventory ? (v.inventory_quantity ?? null) : null,
  }
}

/** Map Medusa product options to Commerce.js ProductOption */
function mapOptions(product: MedusaProduct): ProductOption[] {
  return (product.options ?? []).map(opt => ({
    id: opt.id,
    name: localized(opt.title),
    values: (opt.values ?? []).map(v => ({
      id: v.id,
      name: localized(v.value),
    })),
  }))
}

/** Map Medusa product images to Commerce.js Image */
function mapImages(product: MedusaProduct): Image[] {
  return (product.images ?? []).map(img => ({
    url: img.url,
    alt: img.alt_text ?? product.title,
    width: img.width,
    height: img.height,
  }))
}

/** Map MedusaProduct → Commerce.js Product */
export function mapMedusaProduct(p: MedusaProduct, currency = 'usd'): Product {
  const variants = (p.variants ?? []).map(v => mapVariant(v, currency))
  const images = mapImages(p)
  const firstVariantPrice = variants[0]?.price ?? null
  const categories: Category[] = (p.categories ?? []).map(c => mapMedusaCategory(c))

  return {
    id: p.id,
    sku: p.variants?.[0]?.sku ?? null,
    name: localized(p.title),
    slug: p.handle,
    description: p.description ? localized(p.description) : null,
    shortDescription: p.subtitle ? localized(p.subtitle) : null,
    price: firstVariantPrice,
    primaryImage: p.thumbnail
      ? { url: p.thumbnail, alt: p.title }
      : images[0] ?? null,
    gallery: images,
    rating: null,
    variants,
    options: mapOptions(p),
    attributes: [],
    quantityLimit: null,
    categories,
    inStock: variants.length > 0 ? variants.some(v => v.inStock) : true,
    vatIncluded: false,
    vatRate: null,
    tags: (p.tags ?? []).map(t => t.value),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    productType: p.is_giftcard ? 'gift_card' : 'physical',
    digital: null,
    service: null,
    event: null,
    subscription: null,
    auction: null,
    rental: null,
    preOrder: null,
    requiresShipping: !p.is_giftcard,
    minOrderQuantity: null,
    priceTiers: null,
    customerGroupPricing: null,
    isDropshipped: false,
  }
}
