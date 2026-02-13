<script setup lang="ts">
const items = [
  {
    id: 'wi_1',
    productId: 'p1',
    product: {
      id: 'p1', slug: 'wireless-headphones',
      name: { en: 'Wireless Headphones' },
      type: 'physical', status: 'active',
      primaryImage: { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', alt: 'Headphones' },
      price: { amount: 199.99, currency: 'USD', formatted: '$199.99', originalAmount: 249.99, discountPercent: 20 },
      rating: { average: 4.7, count: 128 }
    },
    addedAt: '2024-12-15T10:00:00Z'
  },
  {
    id: 'wi_2',
    productId: 'p2',
    product: {
      id: 'p2', slug: 'leather-bag',
      name: { en: 'Leather Crossbody Bag' },
      type: 'physical', status: 'active',
      primaryImage: { url: 'https://images.unsplash.com/photo-1548036328-c11fea40e22e?w=300&h=300&fit=crop', alt: 'Bag' },
      price: { amount: 89.00, currency: 'USD', formatted: '$89.00' },
      rating: { average: 4.3, count: 56 }
    },
    addedAt: '2024-12-16T14:30:00Z'
  }
] as any
</script>

<template>
  <ComponentDemo label="Wishlist Grid">
    <CWishlistGrid :items="items" :columns="2" />
  </ComponentDemo>
</template>
