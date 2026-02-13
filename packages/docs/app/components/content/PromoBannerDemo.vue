<script setup lang="ts">
const promotion = {
  id: 'promo_1',
  name: { en: 'Summer Sale' },
  isActive: true,
  discountType: 'percentage',
  discountValue: 30,
  description: { en: 'Up to 30% off on all summer items. Limited time offer!' },
  endsAt: new Date(Date.now() + 3 * 86400000).toISOString(), // 3 days from now
} as any
</script>

<template>
  <ComponentDemo>
    <div class="w-full">
      <CPromoBanner :promotion="promotion" />
    </div>
  </ComponentDemo>
</template>
