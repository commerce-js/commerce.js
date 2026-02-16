# @commercejs/ui

eCommerce UI components for Nuxt — built on [Nuxt UI](https://ui.nuxt.com).

[![npm](https://img.shields.io/npm/v/@commercejs/ui?color=CB3837)](https://www.npmjs.com/package/@commercejs/ui)
[![Nuxt](https://img.shields.io/badge/Nuxt-18181B?logo=nuxt)](https://nuxt.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@commercejs/ui` is a Nuxt module that provides 30+ pre-built Vue components for eCommerce storefronts. Components are auto-imported, use the `C` prefix, and consume `@commercejs/types` data structures directly — no prop mapping needed.

## Install

```bash
npm install @commercejs/ui
```

Add to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@commercejs/ui'],
})
```

## Components

### Product

| Component | Description |
|---|---|
| `CProductCard` | Product card with image, title, price, and add-to-cart |
| `CProductGrid` | Responsive product grid layout |
| `CProductGallery` | Image gallery with thumbnails |
| `CProductPrice` | Price display with sale/compare formatting |
| `CProductOptions` | Variant selector (color, size, etc.) |
| `CProductTypeBadge` | Badge showing product type (rental, auction, etc.) |

### Cart

| Component | Description |
|---|---|
| `CCartDrawer` | Slide-out cart drawer |
| `CCartSummary` | Order summary with totals |
| `CCartItem` | Single cart line item |
| `CQuantitySelector` | Increment/decrement quantity input |

### Checkout

| Component | Description |
|---|---|
| `CCheckoutStepper` | Multi-step checkout progress indicator |
| `CAddressForm` | Shipping/billing address form |

### Order

| Component | Description |
|---|---|
| `COrderCard` | Order summary card |
| `COrderTimeline` | Order status timeline |

### Category & Navigation

| Component | Description |
|---|---|
| `CCategoryFilter` | Category filter sidebar |
| `CSearchBar` | Search bar with command palette |

### Review

| Component | Description |
|---|---|
| `CReviewStars` | Star rating display |
| `CReviewCard` | Individual review card |

### Promotion

| Component | Description |
|---|---|
| `CPromoBanner` | Promotional banner |
| `CCouponInput` | Coupon code input with validation |

### Specialty Commerce

| Component | Description |
|---|---|
| `CAuctionCard` | Auction product card with countdown |
| `CBidPanel` | Live bidding panel |
| `CRentalCard` | Rental product card with availability |
| `CRentalBookingForm` | Date/time rental booking form |
| `CGiftCardForm` | Gift card purchase form |
| `CGiftCardBalance` | Gift card balance checker |
| `CSubscriptionCard` | Subscription plan card |

### Wholesale

| Component | Description |
|---|---|
| `CPriceTierTable` | Volume pricing tier table |
| `CQuoteRequestForm` | B2B quote request form |

### Common

| Component | Description |
|---|---|
| `CEmptyState` | Empty state placeholder |

## Usage

All components are auto-imported. Use them directly in your templates:

```vue
<template>
  <CProductGrid>
    <CProductCard
      v-for="product in products"
      :key="product.id"
      :product="product"
      @add-to-cart="handleAddToCart"
    />
  </CProductGrid>
</template>
```

Components accept `@commercejs/types` objects directly:

```vue
<CCartSummary :cart="cart" />
<COrderTimeline :order="order" />
<CReviewStars :rating="product.rating" />
```

## Peer Dependencies

- `@nuxt/ui` >= 4.0.0

## Documentation

Full docs at [commerce.js.org](https://commerce.js.org)

## License

[MIT](../../LICENSE)
