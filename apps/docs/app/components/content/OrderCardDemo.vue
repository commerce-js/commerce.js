<script setup lang="ts">
const order = {
  id: 'ord_1234567890',
  orderNumber: 'ORD-2024-1234',
  status: 'shipped',
  createdAt: '2024-12-18T14:00:00Z',
  items: [
    { id: 'oi_1', name: { en: 'Wireless Headphones' }, quantity: 1, price: { amount: 199.99, formatted: '$199.99' }, image: { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=60&h=60&fit=crop', alt: 'Headphones' } },
    { id: 'oi_2', name: { en: 'Smart Watch Pro' }, quantity: 1, price: { amount: 349.00, formatted: '$349.00' }, image: { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&h=60&fit=crop', alt: 'Watch' } }
  ],
  totals: {
    total: { amount: 548.99, currency: 'USD', formatted: '$548.99' }
  }
} as any
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-md">
      <COrderCard :order="order" />
    </div>
  </ComponentDemo>
</template>
