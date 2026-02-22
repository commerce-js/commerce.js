// ---------------------------------------------------------------------------
// @commercejs/types — Unified Data Model for eCommerce
// ---------------------------------------------------------------------------
// Barrel export — re-exports all domain types

// Common primitives & utilities
export type { Maybe, Id, LocalizedString, PaginatedResult, PaginationParams, Price, DiscountablePrice, Image, DeepPartial, CommerceErrorCode, TaxStrategy } from './common.js'
export { CommerceError, isCommerceError } from './common.js'

// Product
export type { Product, ProductVariant, ProductOption, Attribute, ProductType, DigitalProductMeta, ServiceProductMeta, EventProductMeta, SubscriptionProductMeta, PreOrderMeta } from './product.js'

// Category
export type { Category } from './category.js'

// Brand
export type { Brand } from './brand.js'

// Cart
export type { Cart, CartItem, CartTotals } from './cart.js'

// Customer
export type { Customer, Address, RegisterInput, UpdateCustomerInput } from './customer.js'

// Profile (cross-merchant buyer identity)
export type { Profile, SavedAddress, SavedPaymentMethod, ProfileMerchantLink } from './profile.js'

// Order
export type { Order, OrderItem, OrderStatus, FulfillmentStatus } from './order.js'

// Order Input (for OrderAdapter.createOrder)
export type { CreateOrderInput, OrderItemInput } from './order-input.js'

// Order Status & History (for OrderAdapter status/timeline methods)
export type { OrderStatusInfo, OrderHistoryEntry, UpdateOrderStatusInput } from './order-status.js'

// Shipping
export type { ShippingMethod, ShippingProvider, FulfillmentType } from './shipping.js'

// Payment
export type { PaymentMethod, PaymentType, Installment } from './payment.js'

// Payment Provider (pluggable gateway interface)
export type {
  PaymentProvider,
  PaymentSession,
  PaymentSessionStatus,
  CreatePaymentSessionInput,
  RefundInput,
  PaymentWebhookEvent,
} from './payment-provider.js'

// Search
export type { SearchParams, SearchResult, Facet, FacetValue, SortOption, SortDirection } from './search.js'

// Wishlist
export type { Wishlist, WishlistItem } from './wishlist.js'

// Review
export type { Review, ReviewInput, ReviewSummary } from './review.js'

// Store
export type { StoreInfo, StoreCurrency, StoreLocale } from './store.js'

// Country
export type { Country } from './country.js'

// Store Location
export type { StoreLocation, Coordinates, LocationContact, WorkingHoursEntry } from './location.js'

// Promotion
export type { Promotion, Coupon, DiscountType, PromotionTarget, PromotionCondition } from './promotion.js'

// Return
export type { ReturnRequest, ReturnItem, CreateReturnInput, ReturnReason, ReturnStatus, RefundMethod } from './return.js'

// Wholesale / B2B
export type { PriceTier, CustomerGroup, CustomerGroupPrice, QuoteRequest, QuoteLineItem, QuoteStatus, CreateQuoteInput, PaymentTerms, PaymentTermsType } from './wholesale.js'

// Auction
export type { AuctionProductMeta, AuctionType, AuctionStatus, Bid, PlaceBidInput } from './auction.js'

// Rental
export type { RentalProductMeta, RentalPricingUnit, RentalPricingTier, AvailabilitySlot, RentalBooking, RentalBookingStatus, CreateRentalBookingInput } from './rental.js'

// Gift Card
export type { GiftCard, GiftCardStatus, GiftCardTransaction, PurchaseGiftCardInput, RedeemGiftCardInput } from './gift-card.js'

// Adapter contract (sub-interfaces + composed)
export type {
  CommerceAdapter,
  CommerceOrchestrator,
  UniversalDomains,
  CommonDomains,
  SpecializedDomains,
  DomainMap,
  OrchestratorDomain,
  CatalogAdapter,
  CartAdapter,
  CheckoutAdapter,
  CustomerAdapter,
  OrderAdapter,
  WishlistAdapter,
  ReviewAdapter,
  StoreAdapter,
  PromotionAdapter,
  ReturnAdapter,
  WholesaleAdapter,
  AuctionAdapter,
  RentalAdapter,
  GiftCardAdapter,
  BrandAdapter,
  CountryAdapter,
  LocationAdapter,
  GetProductParams,
  GetCategoriesParams,
  AddToCartInput,
  AdapterDomain,
} from './adapter.js'

// Notification Provider
export type {
  NotificationProvider,
  NotificationChannel,
  NotificationMessage,
  NotificationResult,
  NotificationRule,
} from './notification.js'

// Analytics Provider
export type { AnalyticsProvider } from './analytics.js'

// Tax Provider
export type {
  TaxProvider,
  TaxCalculationInput,
  TaxLineItem,
  TaxResult,
  TaxLineItemResult,
} from './tax.js'

// Delivery Provider (pluggable last-mile delivery)
export type {
  DeliveryProvider,
  Delivery,
  DeliveryStatus,
  DeliveryAddress,
  DeliveryEstimate,
  EstimateDeliveryInput,
  CreateDeliveryInput,
  DeliveryWebhookEvent,
} from './delivery-provider.js'

// Storage Provider (pluggable object storage for native platform)
export type {
  StorageProvider,
  StorageUploadResult,
  UploadInput,
  PresignedUrlOptions,
  PresignedUrlResult,
} from './storage-provider.js'
