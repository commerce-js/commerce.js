<script setup lang="ts">
const cart = {
  id: 'cart_1',
  items: [
    {
      id: 'ci_1',
      productId: 'p1',
      productSlug: 'wireless-headphones',
      name: { en: 'Wireless Headphones' },
      image: { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&h=120&fit=crop', alt: 'Headphones' },
      quantity: 1,
      price: { amount: 199.99, currency: 'USD', formatted: '$199.99' }
    },
    {
      id: 'ci_2',
      productId: 'p2',
      productSlug: 'smart-watch-pro',
      name: { en: 'Smart Watch Pro' },
      variantName: { en: 'Size: M' },
      image: { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&h=120&fit=crop', alt: 'Watch' },
      quantity: 2,
      price: { amount: 349.00, currency: 'USD', formatted: '$349.00' }
    }
  ],
  itemCount: 3,
  totals: {
    subtotal: { amount: 897.99, currency: 'USD', formatted: '$897.99' },
    total: { amount: 969.83, currency: 'USD', formatted: '$969.83' }
  }
} as any

const isOpen = ref(false)
</script>

<template>
  <ComponentDemo>
    <div class="w-full">
      <UButton icon="i-heroicons-shopping-cart" @click="isOpen = true">Open Cart Drawer</UButton>
      <CCartDrawer v-model:open="isOpen" :cart="cart" />
    </div>
  </ComponentDemo>
</template>
