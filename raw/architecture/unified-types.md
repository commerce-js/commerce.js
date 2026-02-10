# Unified Types

> The @commercejs/types package provides a single data model that works across every eCommerce platform.

The `@commercejs/types` package is the foundation of CommerceJS. It defines TypeScript interfaces for every eCommerce domain — products, carts, orders, customers, payments, and more.

## Why Unified Types?

Every eCommerce platform represents data differently. Salla calls it `name`, Shopify calls it `title`. Salla uses `regular_price`, Shopify uses `price`. The unified types normalize these differences into a single vocabulary.

```ts
// Same Product type, regardless of source
interface Product {
  id: string
  name: LocalizedString
  slug: string
  description: LocalizedString
  price: DiscountablePrice
  variants: ProductVariant[]
  images: Image[]
  // ... more fields
}
```

Adapters map platform-specific data into these types, so application code never deals with platform differences directly.

## Domain Coverage

The type system covers these eCommerce domains:

<table>
<thead>
  <tr>
    <th>
      Domain
    </th>
    
    <th>
      Key Types
    </th>
    
    <th>
      Purpose
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <strong>
        Product
      </strong>
    </td>
    
    <td>
      <code>
        Product
      </code>
      
      , <code>
        ProductVariant
      </code>
      
      , <code>
        ProductOption
      </code>
      
      , <code>
        Attribute
      </code>
    </td>
    
    <td>
      Catalog data
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Category
      </strong>
    </td>
    
    <td>
      <code>
        Category
      </code>
    </td>
    
    <td>
      Product categorization
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Brand
      </strong>
    </td>
    
    <td>
      <code>
        Brand
      </code>
    </td>
    
    <td>
      Brand information
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Cart
      </strong>
    </td>
    
    <td>
      <code>
        Cart
      </code>
      
      , <code>
        CartItem
      </code>
      
      , <code>
        CartTotals
      </code>
    </td>
    
    <td>
      Shopping cart
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Customer
      </strong>
    </td>
    
    <td>
      <code>
        Customer
      </code>
      
      , <code>
        Address
      </code>
    </td>
    
    <td>
      Customer profiles
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Order
      </strong>
    </td>
    
    <td>
      <code>
        Order
      </code>
      
      , <code>
        OrderItem
      </code>
      
      , <code>
        OrderStatus
      </code>
    </td>
    
    <td>
      Order management
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Payment
      </strong>
    </td>
    
    <td>
      <code>
        PaymentMethod
      </code>
      
      , <code>
        PaymentSession
      </code>
    </td>
    
    <td>
      Payment processing
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Shipping
      </strong>
    </td>
    
    <td>
      <code>
        ShippingMethod
      </code>
      
      , <code>
        ShippingProvider
      </code>
    </td>
    
    <td>
      Delivery options
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Search
      </strong>
    </td>
    
    <td>
      <code>
        SearchParams
      </code>
      
      , <code>
        SearchResult
      </code>
      
      , <code>
        Facet
      </code>
    </td>
    
    <td>
      Product search
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Wishlist
      </strong>
    </td>
    
    <td>
      <code>
        Wishlist
      </code>
      
      , <code>
        WishlistItem
      </code>
    </td>
    
    <td>
      Saved items
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Review
      </strong>
    </td>
    
    <td>
      <code>
        Review
      </code>
      
      , <code>
        ReviewInput
      </code>
    </td>
    
    <td>
      Product reviews
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Promotion
      </strong>
    </td>
    
    <td>
      <code>
        Promotion
      </code>
      
      , <code>
        Coupon
      </code>
    </td>
    
    <td>
      Discounts and campaigns
    </td>
  </tr>
</tbody>
</table>

## Common Primitives

Several utility types appear throughout the system:

### LocalizedString

Supports multi-language content with a simple key-value map:

```ts
type LocalizedString = string | Record<string, string>

// Usage
const name: LocalizedString = {
  en: 'Blue T-Shirt',
  ar: 'تي شيرت أزرق',
}
```

### Price and DiscountablePrice

Represent monetary values with optional discount information:

```ts
interface Price {
  amount: number
  currency: string
}

interface DiscountablePrice extends Price {
  compareAtAmount?: number  // Original price before discount
}
```

### PaginatedResult

Standard pagination wrapper for list endpoints:

```ts
interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  hasNext: boolean
}
```

## Adapter Contract

The `CommerceAdapter` interface composes domain-specific sub-adapters. Each sub-adapter handles one domain:

```ts
interface CommerceAdapter {
  catalog: CatalogAdapter
  cart: CartAdapter
  checkout: CheckoutAdapter
  customer: CustomerAdapter
  order: OrderAdapter
  wishlist: WishlistAdapter
  review: ReviewAdapter
  store: StoreAdapter
  promotion: PromotionAdapter
  return: ReturnAdapter
  wholesale: WholesaleAdapter
  auction: AuctionAdapter
  rental: RentalAdapter
  giftCard: GiftCardAdapter
  brand: BrandAdapter
  country: CountryAdapter
  location: LocationAdapter
}
```

<tip>

Not every platform supports every domain. Adapters can return `null` or throw `CommerceError` for unsupported operations. The storefront should handle these gracefully.

</tip>

## Payment Provider Interface

The `PaymentProvider` interface is separate from the adapter — it represents a payment gateway, not a platform:

```ts
interface PaymentProvider {
  createSession(input: CreatePaymentSessionInput): Promise<PaymentSession>
  confirmSession(sessionId: string): Promise<PaymentSession>
  refund(input: RefundInput): Promise<PaymentSession>
  verifyWebhook(event: PaymentWebhookEvent): Promise<boolean>
}
```

The `PaymentSession` tracks the lifecycle of a single payment:

```ts
interface PaymentSession {
  id: string
  providerId: string
  status: PaymentSessionStatus  // 'pending' | 'processing' | 'captured' | 'failed' | 'cancelled'
  amount: number
  currency: string
  redirectUrl: string | null    // 3DS redirect
  providerData?: Record<string, unknown>
  createdAt: string
}
```
