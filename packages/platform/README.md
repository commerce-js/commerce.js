# @commercejs/platform

The built-in CommerceJS commerce engine — a fully functional eCommerce backend powered by SQLite. Zero external APIs, zero configuration, batteries included.

## When to Use

- **Development and testing** — instant local commerce backend without external services
- **Prototyping** — build and demo storefronts with real data flows
- **Embedded commerce** — self-contained eCommerce for desktop apps, edge deployments, or single-tenant setups
- **Reference implementation** — see how a `CommerceAdapter` is built end-to-end

## Installation

```bash
pnpm add @commercejs/platform @commercejs/types
```

## Quick Start

```typescript
import { initDatabase, createPlatformAdapter, seedDrizzle } from '@commercejs/platform'

// 1. Initialize the database (auto-creates all tables)
initDatabase({ driver: 'drizzle' })

// 2. Optionally seed with demo data
seedDrizzle()

// 3. Create the adapter
const adapter = createPlatformAdapter({ currency: 'SAR' })

// 4. Use it — same interface as any CommerceAdapter
const products = await adapter.getProducts({ limit: 10 })
const cart = await adapter.createCart()
const brands = await adapter.getBrands()
const summary = await adapter.getReviewSummary('prod-1')
```

### With the orchestration engine

```typescript
import { createCommerce } from '@commercejs/core'
import { initDatabase, createPlatformAdapter, seedDrizzle } from '@commercejs/platform'

initDatabase({ driver: 'drizzle' })
seedDrizzle()

const commerce = createCommerce({
  adapter: createPlatformAdapter({ currency: 'SAR' }),
})

const products = await commerce.getProducts({ query: 'shirt' })
```

## Implemented Domains

| Domain | Methods | Status |
|---|---|---|
| **Catalog** | `getProduct`, `getProducts`, `getCategories` | ✅ |
| **Cart** | `createCart`, `getCart`, `addToCart`, `updateCartItem`, `removeFromCart`, `applyCoupon`, `removeCoupon` | ✅ |
| **Checkout** | `getShippingMethods`, `setShippingAddress`, `setBillingAddress`, `setShippingMethod`, `getPaymentMethods`, `setPaymentMethod`, `placeOrder` | ✅ |
| **Orders** | `createOrder`, `getOrder`, `getCustomerOrders`, `getOrderStatuses`, `updateOrderStatus`, `cancelOrder`, `duplicateOrder`, `getOrderHistory` | ✅ |
| **Customers** | `login`, `register`, `getCustomer`, `updateCustomer`, `logout`, `forgotPassword`, `resetPassword`, `getAddresses`, `addAddress`, `updateAddress`, `deleteAddress` | ✅ |
| **Store** | `getStoreInfo` | ✅ |
| **Brands** | `getBrands` | ✅ |
| **Countries** | `getCountries` | ✅ |
| **Wishlist** | `getWishlist`, `addToWishlist`, `removeFromWishlist` | ✅ |
| **Reviews** | `getProductReviews`, `getReviewSummary`, `submitReview` | ✅ |
| **Promotions** | `getActivePromotions`, `validateCoupon` | ✅ |
| **Returns** | `createReturn`, `getReturn`, `getReturns`, `getOrderReturns`, `cancelReturn` | ✅ |

### Not Yet Implemented

These domains throw `NOT_SUPPORTED` errors:

`wholesale` · `auctions` · `rentals` · `gift-cards` · `locations`

## Database Drivers

The platform supports two database drivers, both backed by SQLite:

| Driver | ORM | Best For |
|---|---|---|
| `drizzle` (default) | Drizzle ORM | Lightweight, zero-codegen, fast startup |
| `prisma` | Prisma Client | Teams already using Prisma, migration tooling |

```typescript
// Drizzle (default) — synchronous, file-based
initDatabase({ driver: 'drizzle' })

// Prisma — async, requires prisma generate
await initDatabase({ driver: 'prisma' })
```

Both drivers share identical query interfaces and produce identical results — the test suite runs against both.

## Seed Data

The `seedDrizzle()` and `seedPrisma()` functions populate the database with demo data:

| Data | Records |
|---|---|
| Store info | 1 (CommerceJS Demo Store, SAR, en/ar) |
| Categories | 3 (Clothing, Electronics, Accessories) |
| Products | 3 (T-Shirt, Earbuds, Leather Bag) |
| Product images | 3 |
| Product variants | 3 (S/M/L for T-Shirt) |
| Brands | 3 (CommerceJS Essentials, TechWave, Artisan Leather) |
| Countries | 6 (SA, AE, KW, BH, OM, QA) |
| Reviews | 6 (across all 3 products, ratings 3–5) |

## Architecture

```
platform/
├── src/
│   ├── adapter.ts              # createPlatformAdapter() entry point
│   ├── domains/                # Domain implementations
│   │   ├── catalog.ts          # Products, categories, search
│   │   ├── cart.ts             # Cart CRUD, coupon application
│   │   ├── checkout.ts         # Shipping, payment, order placement
│   │   ├── orders.ts           # Order management and status
│   │   ├── customers.ts        # Auth, profiles, addresses
│   │   ├── store.ts            # Store metadata
│   │   ├── brands.ts           # Brand listing
│   │   ├── countries.ts        # Country listing
│   │   ├── wishlist.ts         # Favorites
│   │   ├── reviews.ts          # Ratings and reviews
│   │   ├── promotions.ts       # Discounts and coupons
│   │   ├── returns.ts          # Return requests
│   │   └── not-supported.ts    # Stub domains (501)
│   ├── database/
│   │   ├── drizzle/            # Drizzle ORM driver
│   │   │   ├── schema/         # Table definitions
│   │   │   ├── queries/        # Query functions
│   │   │   ├── migrate.ts      # Auto-migration
│   │   │   └── seed.ts         # Demo data
│   │   └── prisma/             # Prisma driver (mirrors Drizzle)
│   └── __tests__/              # Test suite (runs against both drivers)
```

## Testing

```bash
# Run all platform tests
pnpm vitest run

# Watch mode
pnpm vitest
```

The test suite runs 46 tests against each driver (92 total), covering all implemented domains including seed data validation, CRUD operations, pagination, and error handling.

## License

[MIT](../../LICENSE)
