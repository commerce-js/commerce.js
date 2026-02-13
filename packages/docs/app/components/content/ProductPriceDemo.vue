<script setup lang="ts">
const price = {
  amount: 199.99,
  currency: 'USD',
  formatted: '$199.99',
  originalAmount: 249.99,
  discountPercent: 20
}

const salePrice = {
  amount: 49.99,
  currency: 'USD',
  formatted: '$49.99',
  originalAmount: 99.99,
  discountPercent: 50
}

const regularPrice = {
  amount: 79.00,
  currency: 'USD',
  formatted: '$79.00'
}
</script>

<template>
  <ComponentDemo>
    <div class="flex items-center gap-8">
      <div class="text-center">
        <div class="text-xs text-[var(--ui-text-muted)] mb-1">With Discount</div>
        <CProductPrice :price="price" />
      </div>
      <div class="text-center">
        <div class="text-xs text-[var(--ui-text-muted)] mb-1">50% Off</div>
        <CProductPrice :price="salePrice" />
      </div>
      <div class="text-center">
        <div class="text-xs text-[var(--ui-text-muted)] mb-1">Regular</div>
        <CProductPrice :price="regularPrice" />
      </div>
    </div>
  </ComponentDemo>
</template>
