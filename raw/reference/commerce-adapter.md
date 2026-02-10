# CommerceAdapter

> The CommerceAdapter interface — the contract every eCommerce platform implements.

The `CommerceAdapter` interface defines the contract for eCommerce platform integrations. It is composed of domain-specific sub-adapters, each handling one area of commerce functionality.

## Interface Definition

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

## CatalogAdapter

Product and category retrieval.

```ts
interface CatalogAdapter {
  getProducts(params?: GetProductParams): Promise<PaginatedResult<Product>>
  getProduct(id: string): Promise<Product>
  getCategories(params?: GetCategoriesParams): Promise<Category[]>
}
```

### GetProductParams

```ts
interface GetProductParams extends PaginationParams {
  categoryId?: string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}
```

## CartAdapter

Cart operations — add, remove, update.

```ts
interface CartAdapter {
  getCart(cartId?: string): Promise<Cart>
  addToCart(input: AddToCartInput): Promise<Cart>
  updateCartItem(cartId: string, itemId: string, quantity: number): Promise<Cart>
  removeFromCart(cartId: string, itemId: string): Promise<Cart>
  clearCart(cartId: string): Promise<Cart>
}
```

### AddToCartInput

```ts
interface AddToCartInput {
  productId: string
  variantId?: string
  quantity: number
  metadata?: Record<string, unknown>
}
```

## CheckoutAdapter

Shipping and payment method retrieval for checkout flows.

```ts
interface CheckoutAdapter {
  getShippingMethods(cartId: string): Promise<ShippingMethod[]>
  getPaymentMethods(): Promise<PaymentMethod[]>
}
```

## CustomerAdapter

Customer profiles, authentication, and addresses.

```ts
interface CustomerAdapter {
  getCustomer(id: string): Promise<Customer>
  login(email: string, password: string): Promise<Customer>
  register(input: RegisterInput): Promise<Customer>
  updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer>
}
```

## OrderAdapter

Order management — creation, retrieval, and status tracking.

```ts
interface OrderAdapter {
  getOrders(params?: PaginationParams): Promise<PaginatedResult<Order>>
  getOrder(id: string): Promise<Order>
  createOrder(input: CreateOrderInput): Promise<Order>
  getOrderStatus(id: string): Promise<OrderStatusInfo>
  getOrderHistory(id: string): Promise<OrderHistoryEntry[]>
  updateOrderStatus(id: string, input: UpdateOrderStatusInput): Promise<OrderStatusInfo>
}
```

## StoreAdapter

Store metadata and configuration.

```ts
interface StoreAdapter {
  getStoreInfo(): Promise<StoreInfo>
}
```

### StoreInfo

```ts
interface StoreInfo {
  id: string
  name: string
  description: string
  logo?: Image
  url: string
  currency: StoreCurrency
  locale: StoreLocale
  metadata?: Record<string, unknown>
}
```

## Additional Adapters

<table>
<thead>
  <tr>
    <th>
      Adapter
    </th>
    
    <th>
      Key Methods
    </th>
    
    <th>
      Domain
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        WishlistAdapter
      </code>
    </td>
    
    <td>
      <code>
        getWishlist
      </code>
      
      , <code>
        addToWishlist
      </code>
      
      , <code>
        removeFromWishlist
      </code>
    </td>
    
    <td>
      Saved items
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        ReviewAdapter
      </code>
    </td>
    
    <td>
      <code>
        getReviews
      </code>
      
      , <code>
        submitReview
      </code>
    </td>
    
    <td>
      Product reviews
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        PromotionAdapter
      </code>
    </td>
    
    <td>
      <code>
        applyCoupon
      </code>
      
      , <code>
        removeCoupon
      </code>
      
      , <code>
        getPromotions
      </code>
    </td>
    
    <td>
      Discounts
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        ReturnAdapter
      </code>
    </td>
    
    <td>
      <code>
        createReturn
      </code>
      
      , <code>
        getReturn
      </code>
      
      , <code>
        getReturns
      </code>
    </td>
    
    <td>
      Return requests
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        WholesaleAdapter
      </code>
    </td>
    
    <td>
      <code>
        getPriceTiers
      </code>
      
      , <code>
        getQuote
      </code>
      
      , <code>
        createQuote
      </code>
    </td>
    
    <td>
      B2B pricing
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        AuctionAdapter
      </code>
    </td>
    
    <td>
      <code>
        getBids
      </code>
      
      , <code>
        placeBid
      </code>
    </td>
    
    <td>
      Auction products
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        RentalAdapter
      </code>
    </td>
    
    <td>
      <code>
        getAvailability
      </code>
      
      , <code>
        createBooking
      </code>
    </td>
    
    <td>
      Rental products
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        GiftCardAdapter
      </code>
    </td>
    
    <td>
      <code>
        purchaseCard
      </code>
      
      , <code>
        redeemCard
      </code>
      
      , <code>
        getBalance
      </code>
    </td>
    
    <td>
      Gift cards
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        BrandAdapter
      </code>
    </td>
    
    <td>
      <code>
        getBrands
      </code>
      
      , <code>
        getBrand
      </code>
    </td>
    
    <td>
      Brand data
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        CountryAdapter
      </code>
    </td>
    
    <td>
      <code>
        getCountries
      </code>
    </td>
    
    <td>
      Country list
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        LocationAdapter
      </code>
    </td>
    
    <td>
      <code>
        getLocations
      </code>
      
      , <code>
        getLocation
      </code>
    </td>
    
    <td>
      Store locations
    </td>
  </tr>
</tbody>
</table>

## AdapterDomain

Every sub-adapter is accessible through the `AdapterDomain` type for dynamic access:

```ts
type AdapterDomain = keyof CommerceAdapter
// 'catalog' | 'cart' | 'checkout' | 'customer' | 'order' | ...
```

## Implementations

<table>
<thead>
  <tr>
    <th>
      Package
    </th>
    
    <th>
      Platform
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        @commercejs/adapter-salla
      </code>
    </td>
    
    <td>
      <a href="https://salla.com" rel="nofollow">
        Salla
      </a>
    </td>
  </tr>
</tbody>
</table>

<read-more to="/guides/adapter-development">

Build your own CommerceAdapter implementation.

</read-more>
