<script setup lang="ts">
const item = {
  id: 'ci_1',
  productId: 'prod_1',
  variantId: 'var_1',
  name: { en: 'Premium Wireless Headphones' },
  image: {
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&h=120&fit=crop',
    alt: 'Headphones'
  },
  quantity: 2,
  price: {
    amount: 199.99,
    currency: 'USD',
    formatted: '$199.99'
  }
} as any
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-lg">
      <CCartItem :item="item" />
    </div>
  </ComponentDemo>
</template>
