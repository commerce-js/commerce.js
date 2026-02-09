// ---------------------------------------------------------------------------
// Product domain types
// ---------------------------------------------------------------------------

import type { DiscountablePrice, Id, Image, LocalizedString, Maybe, Price } from './common.js'
import type { Category } from './category.js'
import type { PriceTier, CustomerGroupPrice } from './wholesale.js'
import type { AuctionProductMeta } from './auction.js'
import type { RentalProductMeta } from './rental.js'

/** Product attribute (e.g., color, size, material) */
export interface Attribute {
  /** Machine-readable code (e.g., "color") */
  code: string
  /** Human-readable name */
  name: LocalizedString
  /** Display value */
  value: LocalizedString
}

/** A selectable product option group (e.g. Size, Color) */
export interface ProductOption {
  /** Machine-readable identifier */
  id: Id
  /** Human-readable option name (e.g. "Size", "Color") */
  name: LocalizedString
  /** Possible values for this option */
  values: { id: Id; name: LocalizedString }[]
}

/** A specific variant of a product (e.g., "Red / XL") */
export interface ProductVariant {
  id: Id
  sku: Maybe<string>
  name: Maybe<LocalizedString>
  price: Maybe<DiscountablePrice>
  attributes: Attribute[]
  inStock: boolean
  inventoryQuantity: Maybe<number>
}

// ---- Product type discriminator & metadata ----

/** Classifies the product for fulfillment logic and UI rendering */
export type ProductType = 'physical' | 'digital' | 'service' | 'event' | 'subscription' | 'auction' | 'rental' | 'gift_card'

/** Metadata for digital products (ebooks, software, courses, etc.) */
export interface DigitalProductMeta {
  /** Download URL (populated after purchase) */
  downloadUrl: Maybe<string>
  /** File size in bytes (for display) */
  fileSize: Maybe<number>
  /** File format / MIME type (e.g., "application/pdf") */
  fileType: Maybe<string>
  /** License key (populated after purchase) */
  licenseKey: Maybe<string>
  /** Maximum number of downloads allowed (null = unlimited) */
  maxDownloads: Maybe<number>
  /** Download link expiry duration in hours (null = never) */
  expiresInHours: Maybe<number>
}

/** Metadata for service products (consulting, repairs, bookings) */
export interface ServiceProductMeta {
  /** Estimated duration in minutes */
  durationMinutes: Maybe<number>
  /** Whether the service requires scheduling / booking */
  requiresBooking: boolean
  /** Service delivery mode */
  deliveryMode: 'in_person' | 'remote' | 'hybrid'
}

/** Metadata for event/ticket products (concerts, conferences, classes) */
export interface EventProductMeta {
  /** Event start date/time (ISO 8601) */
  startDate: string
  /** Event end date/time (ISO 8601) */
  endDate: Maybe<string>
  /** Venue name */
  venue: Maybe<LocalizedString>
  /** Venue address or online meeting URL */
  location: Maybe<string>
  /** Whether the event is virtual / online */
  isVirtual: boolean
  /** Seat or section information */
  seatInfo: Maybe<string>
  /** Total available seats / capacity (null = unlimited) */
  capacity: Maybe<number>
}

/** Metadata for subscription products (recurring billing) */
export interface SubscriptionProductMeta {
  /** Billing interval */
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  /** Number of intervals between billings (e.g., 2 = every 2 months) */
  intervalCount: number
  /** Free trial period in days (0 = no trial) */
  trialDays: number
  /** Price per billing cycle (may differ from product.price for introductory offers) */
  recurringPrice: Price
}

/** Pre-order availability information */
export interface PreOrderMeta {
  /** Whether this product is available for pre-order */
  enabled: boolean
  /** Expected release / availability date (ISO 8601) */
  releaseDate: Maybe<string>
  /** Optional deposit amount (null = full price required) */
  depositAmount: Maybe<Price>
  /** Pre-order message to display (e.g., "Ships by March 2026") */
  message: Maybe<LocalizedString>
}

/** Core product entity */
export interface Product {
  id: Id
  sku: Maybe<string>
  /** Bilingual product name */
  name: LocalizedString
  slug: string
  /** Bilingual product description (may contain HTML) */
  description: Maybe<LocalizedString>
  /** Short description for listings */
  shortDescription: Maybe<LocalizedString>
  price: Maybe<DiscountablePrice>
  primaryImage: Maybe<Image>
  gallery: Image[]
  rating: Maybe<{
    average: number
    count: number
  }>
  variants: ProductVariant[]
  /** Selectable option groups (Size, Color, etc.) */
  options: ProductOption[]
  attributes: Attribute[]
  /** Maximum purchasable quantity (null = unlimited) */
  quantityLimit: Maybe<number>
  categories: Category[]
  inStock: boolean
  /** Whether the displayed price includes VAT */
  vatIncluded: boolean
  /** VAT rate as a decimal (e.g., 0.15 for KSA 15%) */
  vatRate: Maybe<number>
  tags: string[]
  createdAt: string
  updatedAt: string

  // ---- Product type & metadata (additive, non-breaking) ----

  /** Product classification — drives fulfillment logic and UI. Defaults to 'physical' */
  productType: ProductType

  /** Digital product metadata (present when productType === 'digital') */
  digital: Maybe<DigitalProductMeta>

  /** Service product metadata (present when productType === 'service') */
  service: Maybe<ServiceProductMeta>

  /** Event/ticket metadata (present when productType === 'event') */
  event: Maybe<EventProductMeta>

  /** Subscription metadata (present when productType === 'subscription') */
  subscription: Maybe<SubscriptionProductMeta>

  /** Auction metadata (present when productType === 'auction') */
  auction: Maybe<AuctionProductMeta>

  /** Rental metadata (present when productType === 'rental') */
  rental: Maybe<RentalProductMeta>

  /** Pre-order information (present on any productType) */
  preOrder: Maybe<PreOrderMeta>

  /** Whether this product requires shipping (false for digital, services, events) */
  requiresShipping: boolean

  // ---- Wholesale / B2B (additive) ----

  /** Minimum order quantity for this product (null = 1) */
  minOrderQuantity: Maybe<number>

  /** Volume-based pricing tiers (null = single price) */
  priceTiers: Maybe<PriceTier[]>

  /** Per-customer-group price overrides */
  customerGroupPricing: Maybe<CustomerGroupPrice[]>

  // ---- Fulfillment ----

  /** Whether this product is fulfilled by a third-party / dropshipper */
  isDropshipped: boolean
}
