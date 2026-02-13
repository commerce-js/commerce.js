<script setup lang="ts">
const cart = {
  id: 'cart_1',
  items: [],
  itemCount: 3,
  totals: {
    subtotal: { amount: 549.98, currency: 'USD', formatted: '$549.98' },
    shipping: { amount: 0, currency: 'USD', formatted: 'Free' },
    tax: { amount: 44.00, currency: 'USD', formatted: '$44.00' },
    discount: { amount: 50.00, currency: 'USD', formatted: '$50.00' },
    total: { amount: 543.98, currency: 'USD', formatted: '$543.98' }
  }
} as any
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-xs">
      <CCartSummary :cart="cart" />
    </div>
  </ComponentDemo>
</template>
