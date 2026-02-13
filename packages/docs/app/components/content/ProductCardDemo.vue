<script setup lang="ts">
const product = {
  id: 'prod_1',
  slug: 'premium-wireless-headphones',
  name: { en: 'Premium Wireless Headphones' },
  description: { en: 'High-quality noise-cancelling wireless headphones with 30-hour battery life.' },
  type: 'physical',
  status: 'active',
  primaryImage: {
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    alt: 'Premium Wireless Headphones'
  },
  price: {
    amount: 199.99,
    currency: 'USD',
    formatted: '$199.99',
    originalAmount: 249.99,
    discountPercent: 20
  },
  rating: {
    average: 4.7,
    count: 128
  }
}
</script>

<template>
  <ComponentDemo>
    <div class="w-72">
      <CProductCard
        as="div"
        :product="product"
        show-rating
        show-wishlist
      />
    </div>
  </ComponentDemo>
</template>
