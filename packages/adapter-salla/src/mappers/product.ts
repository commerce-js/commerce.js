// ---------------------------------------------------------------------------
// Salla → Product mapper
// ---------------------------------------------------------------------------

import type {
  Product,
  ProductVariant,
  ProductOption,
  Attribute,
  ProductType,
  Image,
  Maybe,
  DiscountablePrice,
  LocalizedString,
  Price,
} from '@commercejs/types'
import type { SallaRawProduct, SallaRawSku, SallaRawImage, SallaRawOption } from '../types.js'

/** Map Salla product type string → our ProductType discriminator */
function mapProductType(type: SallaRawProduct['type']): ProductType {
  switch (type) {
    case 'digital':
    case 'codes':
      return 'digital'
    case 'service':
      return 'service'
    case 'food':
    case 'group_products':
    case 'product':
    default:
      return 'physical'
  }
}

/** Format a price amount as a human-readable string */
function formatAmount(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`
}

/** Build a Price object from amount + currency */
function toPrice(amount: number, currency: string): Price {
  return { amount, currency, formatted: formatAmount(amount, currency) }
}

/** Map a Salla raw image → our Image type */
function mapImage(img: SallaRawImage): Image {
  return {
    url: img.url,
    alt: img.alt ?? '',
  }
}

/** Build a bilingual LocalizedString from Salla (API returns single-locale) */
function toLocalized(value: string | null, locale: string = 'ar'): LocalizedString {
  if (locale === 'en') {
    return { ar: '', en: value ?? '' }
  }
  return { ar: value ?? '', en: '' }
}

/** Map Salla raw product → unified Product */
export function mapSallaProduct(raw: SallaRawProduct, locale: string = 'ar'): Product {
  const productType = mapProductType(raw.type)

  const price: Maybe<DiscountablePrice> = {
    amount: raw.price.amount,
    currency: raw.price.currency,
    formatted: formatAmount(raw.price.amount, raw.price.currency),
    originalAmount: raw.regular_price.amount !== raw.price.amount ? raw.regular_price.amount : undefined,
    discountPercent: raw.sale_price
      ? Math.round(((raw.regular_price.amount - raw.sale_price.amount) / raw.regular_price.amount) * 100)
      : undefined,
  }

  const primaryImage: Maybe<Image> =
    raw.images.find((img) => img.main) ? mapImage(raw.images.find((img) => img.main)!) : raw.images[0] ? mapImage(raw.images[0]) : null

  const gallery: Image[] = raw.images.map(mapImage)

  const variants: ProductVariant[] = raw.skus.map((sku) => mapSallaSku(sku, raw, locale))

  // Only show options as specifications when there are no SKU variants,
  // otherwise they are already represented in the Variants section
  const attributes: Attribute[] = raw.skus.length > 0
    ? []
    : raw.options.flatMap((opt) =>
        opt.values.map((v) => ({
          code: String(opt.id),
          name: toLocalized(opt.name, locale),
          value: toLocalized(v.name, locale),
        })),
      )

  return {
    id: String(raw.id),
    sku: raw.sku,
    name: toLocalized(raw.name, locale),
    slug: raw.slug,
    description: raw.description ? toLocalized(raw.description, locale) : null,
    shortDescription: raw.short_description ? toLocalized(raw.short_description, locale) : null,
    price,
    primaryImage,
    gallery,
    rating: raw.rating ? { average: raw.rating.average, count: raw.rating.count } : null,
    variants,
    options: raw.options.map((opt) => ({
      id: String(opt.id),
      name: toLocalized(opt.name, locale),
      values: opt.values.map((v) => ({
        id: String(v.id),
        name: toLocalized(v.name, locale),
      })),
    })),
    attributes,
    quantityLimit: raw.max_quantity_per_order,
    categories: raw.categories.map((cat) => ({
      id: String(cat.id),
      name: toLocalized(cat.name, locale),
      slug: cat.slug,
      description: null,
      image: null,
      parentId: null,
      children: [],
      productCount: null,
      sortOrder: 0,
    })),
    inStock: raw.is_available,
    vatIncluded: true,
    vatRate: 0.15,
    tags: raw.tags.map((t) => t.name),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,

    // Product type metadata
    productType,
    digital: productType === 'digital' ? { downloadUrl: null, fileSize: null, fileType: null, licenseKey: null, maxDownloads: null, expiresInHours: null } : null,
    service: productType === 'service' ? { durationMinutes: null, requiresBooking: false, deliveryMode: 'in_person' } : null,
    event: null,
    subscription: null,
    auction: null,
    rental: null,
    preOrder: null,
    requiresShipping: raw.require_shipping,
    minOrderQuantity: raw.min_quantity_per_order,
    priceTiers: null,
    customerGroupPricing: null,
    isDropshipped: false,
  }
}

/** Map Salla SKU → ProductVariant */
function mapSallaSku(sku: SallaRawSku, product: SallaRawProduct, locale: string): ProductVariant {
  // Note: In Salla, SKU resolution is done server-side when adding to cart.
  // The frontend sends selected option value IDs (e.g. { optionId: valueId })
  // and Salla resolves the correct SKU + price. We don't map variant attributes
  // because `related_option_values` is unreliable for client-side matching.
  return {
    id: String(sku.id),
    sku: sku.sku,
    name: null,
    price: {
      amount: sku.price.amount,
      currency: sku.price.currency,
      formatted: formatAmount(sku.price.amount, sku.price.currency),
      originalAmount: sku.regular_price.amount !== sku.price.amount ? sku.regular_price.amount : undefined,
      discountPercent: sku.sale_price
        ? Math.round(((sku.regular_price.amount - sku.sale_price.amount) / sku.regular_price.amount) * 100)
        : undefined,
    },
    inStock: sku.is_available ?? product.is_available,
    inventoryQuantity: sku.stock_quantity,
    attributes: [],
  }
}
