<script setup lang="ts">
const tiers = [
  { minQuantity: 1, maxQuantity: 9, unitPrice: { amount: 29.99, currency: 'USD', formatted: '$29.99' }, label: { en: 'Retail' } },
  { minQuantity: 10, maxQuantity: 49, unitPrice: { amount: 24.99, currency: 'USD', formatted: '$24.99' }, label: { en: 'Small Wholesale' } },
  { minQuantity: 50, maxQuantity: 199, unitPrice: { amount: 19.99, currency: 'USD', formatted: '$19.99' }, label: { en: 'Wholesale' } },
  { minQuantity: 200, maxQuantity: null, unitPrice: { amount: 14.99, currency: 'USD', formatted: '$14.99' }, label: { en: 'Bulk' } },
] as any
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-md">
      <CPriceTierTable :tiers="tiers" :current-quantity="25" />
    </div>
  </ComponentDemo>
</template>
