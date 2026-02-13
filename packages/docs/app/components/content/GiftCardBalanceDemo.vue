<script setup lang="ts">
const giftCard = {
  id: 'gc_1',
  code: 'GIFT-ABCD-1234',
  currentBalance: { amount: 75.50, currency: 'USD', formatted: '$75.50' },
  initialBalance: { amount: 100, currency: 'USD', formatted: '$100.00' },
  status: 'active',
  expiresAt: '2025-12-31T23:59:59Z'
} as any
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-sm">
      <CGiftCardBalance :gift-card="giftCard" />
    </div>
  </ComponentDemo>
</template>
