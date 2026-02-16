<script setup lang="ts">
import type { Product } from '@commercejs/types'

const products: Product[] = [
  {
    id: 'p1',
    slug: 'wireless-headphones',
    name: { en: 'Wireless Headphones' },
    type: 'physical',
    status: 'active',
    primaryImage: { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', alt: 'Headphones' },
    price: { amount: 199.99, currency: 'USD', formatted: '$199.99', originalAmount: 249.99, discountPercent: 20 },
    rating: { average: 4.7, count: 128 }
  },
  {
    id: 'p2',
    slug: 'smart-watch',
    name: { en: 'Smart Watch Pro' },
    type: 'physical',
    status: 'active',
    primaryImage: { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop', alt: 'Watch' },
    price: { amount: 349.00, currency: 'USD', formatted: '$349.00' },
    rating: { average: 4.5, count: 89 }
  },
  {
    id: 'p3',
    slug: 'leather-bag',
    name: { en: 'Leather Crossbody Bag' },
    type: 'physical',
    status: 'active',
    primaryImage: { url: 'https://images.unsplash.com/photo-1548036328-c11fea40e22e?w=300&h=300&fit=crop', alt: 'Bag' },
    price: { amount: 89.00, currency: 'USD', formatted: '$89.00', originalAmount: 129.00, discountPercent: 31 },
    rating: { average: 4.3, count: 56 }
  },
  {
    id: 'p4',
    slug: 'sunglasses',
    name: { en: 'Designer Sunglasses' },
    type: 'physical',
    status: 'active',
    primaryImage: { url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop', alt: 'Sunglasses' },
    price: { amount: 159.00, currency: 'USD', formatted: '$159.00' },
    rating: { average: 4.8, count: 203 }
  }
]
</script>

<template>
  <ComponentDemo label="Preview — 4-column grid">
    <CProductGrid :products="products" :columns="4" />
  </ComponentDemo>
</template>
