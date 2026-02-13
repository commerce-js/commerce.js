---
title: "Components"
description: "Ready-made Vue components for building commerce storefronts."
---

# UI Components

Commerce.js provides **33 Vue components** designed for commerce storefronts. Every component follows [Nuxt UI](https://ui.nuxt.com) conventions: typed props, named slots, theme overrides via `ui` prop, and global theming through `app.config.ts`.

## Categories

::card-group
  ::card{title="Product" icon="i-heroicons-cube" to="/components/product/product-card"}
  Product cards, pricing, gallery, options, and grid layout.
  ::

  ::card{title="Cart" icon="i-heroicons-shopping-cart" to="/components/cart/cart-drawer"}
  Cart drawer, items, summary, and quantity selector.
  ::

  ::card{title="Checkout" icon="i-heroicons-credit-card" to="/components/checkout/address-form"}
  Address form and checkout stepper.
  ::

  ::card{title="Order" icon="i-heroicons-clipboard-document-list" to="/components/order/order-card"}
  Order cards and status timeline.
  ::

  ::card{title="Review" icon="i-heroicons-star" to="/components/review/review-card"}
  Review cards and star ratings.
  ::

  ::card{title="Promotion" icon="i-heroicons-tag" to="/components/promotion/coupon-input"}
  Coupon inputs and promo banners.
  ::

  ::card{title="Navigation" icon="i-heroicons-magnifying-glass" to="/components/navigation/search-bar"}
  Search bar with live suggestions.
  ::

  ::card{title="Common" icon="i-heroicons-squares-2x2" to="/components/common/empty-state"}
  Empty states and product type badges.
  ::

  ::card{title="Marketing" icon="i-heroicons-megaphone" to="/components/marketing/hero-banner"}
  Hero banners for landing pages.
  ::

  ::card{title="Category" icon="i-heroicons-funnel" to="/components/category/category-filter"}
  Faceted filtering sidebar.
  ::

  ::card{title="Wishlist" icon="i-heroicons-heart" to="/components/wishlist/wishlist-grid"}
  Wishlist grid with actions.
  ::

  ::card{title="Subscription" icon="i-heroicons-arrow-path" to="/components/subscription/subscription-card"}
  Subscription pricing cards.
  ::

  ::card{title="Auction" icon="i-heroicons-banknotes" to="/components/auction/auction-card"}
  Auction cards and bid panels.
  ::

  ::card{title="Rental" icon="i-heroicons-calendar-days" to="/components/rental/rental-card"}
  Rental cards and booking forms.
  ::

  ::card{title="Gift Card" icon="i-heroicons-gift" to="/components/gift-card/gift-card-form"}
  Gift card purchase and balance.
  ::

  ::card{title="Wholesale" icon="i-heroicons-building-storefront" to="/components/wholesale/price-tier-table"}
  Price tiers and RFQ forms.
  ::

  ::card{title="Event" icon="i-heroicons-ticket" to="/components/event/event-card"}
  Event/ticket product cards.
  ::
::

## Installation

```bash
pnpm add @commercejs/ui
```

Register the module in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@commercejs/ui'],
})
```

## Conventions

### Theming

Override styles per-instance with the `ui` prop, or globally via `app.config.ts`:

```ts
// app.config.ts
export default defineAppConfig({
  ui: {
    productCard: {
      slots: {
        root: 'rounded-2xl shadow-xl',
        title: 'text-lg font-bold',
      },
    },
  },
})
```

→ See the [@commercejs/ui package page](/packages/ui) for full documentation.
