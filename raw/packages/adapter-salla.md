# @commercejs/adapter-salla

> Salla platform adapter — maps Salla's API to the unified CommerceAdapter interface.

The `@commercejs/adapter-salla` package implements the `CommerceAdapter` interface for [Salla](https://salla.com), the leading eCommerce platform in Saudi Arabia and the MENA region.

## Installation

```bash
pnpm add @commercejs/adapter-salla
```

## Configuration

```ts
import { createSallaAdapter } from '@commercejs/adapter-salla'

const adapter = createSallaAdapter({
  token: 'your-salla-api-token',
  baseUrl: 'https://api.salla.dev/admin/v2',
})
```

<table>
<thead>
  <tr>
    <th>
      Option
    </th>
    
    <th>
      Type
    </th>
    
    <th>
      Required
    </th>
    
    <th>
      Description
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        token
      </code>
    </td>
    
    <td>
      <code>
        string
      </code>
    </td>
    
    <td>
      Yes
    </td>
    
    <td>
      Salla API access token
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        baseUrl
      </code>
    </td>
    
    <td>
      <code>
        string
      </code>
    </td>
    
    <td>
      No
    </td>
    
    <td>
      API base URL
    </td>
  </tr>
</tbody>
</table>

## Supported Domains

The adapter implements these sub-adapters:

<table>
<thead>
  <tr>
    <th>
      Domain
    </th>
    
    <th>
      Methods
    </th>
    
    <th>
      Status
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <strong>
        Catalog
      </strong>
    </td>
    
    <td>
      <code>
        getProducts
      </code>
      
      , <code>
        getProduct
      </code>
      
      , <code>
        getCategories
      </code>
    </td>
    
    <td>
      ✅ Implemented
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
        getCart
      </code>
      
      , <code>
        addToCart
      </code>
      
      , <code>
        removeFromCart
      </code>
      
      , <code>
        updateCartItem
      </code>
    </td>
    
    <td>
      ✅ Implemented
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
        getCustomer
      </code>
      
      , <code>
        login
      </code>
      
      , <code>
        register
      </code>
    </td>
    
    <td>
      ✅ Implemented
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
        getOrders
      </code>
      
      , <code>
        getOrder
      </code>
      
      , <code>
        createOrder
      </code>
      
      , <code>
        getOrderStatus
      </code>
      
      , <code>
        getOrderHistory
      </code>
    </td>
    
    <td>
      ✅ Implemented
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Store
      </strong>
    </td>
    
    <td>
      <code>
        getStoreInfo
      </code>
    </td>
    
    <td>
      ✅ Implemented
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
        getBrands
      </code>
      
      , <code>
        getBrand
      </code>
    </td>
    
    <td>
      ✅ Implemented
    </td>
  </tr>
  
  <tr>
    <td>
      <strong>
        Country
      </strong>
    </td>
    
    <td>
      <code>
        getCountries
      </code>
    </td>
    
    <td>
      ✅ Implemented
    </td>
  </tr>
</tbody>
</table>

## Data Mapping

The adapter transforms Salla's API responses into unified CommerceJS types. Key mappings:

### Product Mapping

<table>
<thead>
  <tr>
    <th>
      Salla Field
    </th>
    
    <th>
      CommerceJS Field
    </th>
    
    <th>
      Notes
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        name
      </code>
    </td>
    
    <td>
      <code>
        name
      </code>
    </td>
    
    <td>
      Wrapped in <code>
        LocalizedString
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        regular_price.amount
      </code>
    </td>
    
    <td>
      <code>
        price.amount
      </code>
    </td>
    
    <td>
      Normalized to <code>
        DiscountablePrice
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        sale_price.amount
      </code>
    </td>
    
    <td>
      <code>
        price.compareAtAmount
      </code>
    </td>
    
    <td>
      Original price before discount
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        images[].url
      </code>
    </td>
    
    <td>
      <code>
        images[].url
      </code>
    </td>
    
    <td>
      Mapped to <code>
        Image
      </code>
      
       type
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        options
      </code>
    </td>
    
    <td>
      <code>
        options
      </code>
    </td>
    
    <td>
      Mapped to <code>
        ProductOption
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        skus
      </code>
    </td>
    
    <td>
      <code>
        variants
      </code>
    </td>
    
    <td>
      Mapped to <code>
        ProductVariant
      </code>
    </td>
  </tr>
</tbody>
</table>

### Order Status Mapping

<table>
<thead>
  <tr>
    <th>
      Salla Status
    </th>
    
    <th>
      CommerceJS Status
    </th>
  </tr>
</thead>

<tbody>
  <tr>
    <td>
      <code>
        created
      </code>
    </td>
    
    <td>
      <code>
        pending
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        in_progress
      </code>
    </td>
    
    <td>
      <code>
        processing
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        completed
      </code>
    </td>
    
    <td>
      <code>
        delivered
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        cancelled
      </code>
    </td>
    
    <td>
      <code>
        cancelled
      </code>
    </td>
  </tr>
  
  <tr>
    <td>
      <code>
        refunded
      </code>
    </td>
    
    <td>
      <code>
        refunded
      </code>
    </td>
  </tr>
</tbody>
</table>

## Usage Examples

### Fetch Products

```ts
const products = await adapter.catalog.getProducts({
  limit: 10,
  page: 1,
})
// Returns PaginatedResult<Product>
```

### Get Single Product

```ts
const product = await adapter.catalog.getProduct('product-123')
// Returns Product with variants, images, options
```

### Fetch Orders

```ts
const orders = await adapter.order.getOrders({
  limit: 20,
  page: 1,
})
// Returns PaginatedResult<Order>
```

### Get Order Timeline

```ts
const history = await adapter.order.getOrderHistory('order-456')
// Returns OrderHistoryEntry[] - status changes with timestamps
```

## Error Handling

The adapter wraps Salla API errors in `CommerceError`:

```ts
import { isCommerceError } from '@commercejs/types'

try {
  await adapter.catalog.getProduct('nonexistent')
} catch (err) {
  if (isCommerceError(err)) {
    // err.code === 'NOT_FOUND'
    // err.message === 'Product not found'
  }
}
```
