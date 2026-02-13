<script setup lang="ts">
const product = {
  id: 'rental_1',
  slug: 'premium-camera-kit',
  name: { en: 'Premium Camera Kit' },
  primaryImage: {
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
    alt: 'Camera Kit'
  },
  rental: {
    pricePerUnit: { amount: 45, currency: 'USD', formatted: '$45' },
    pricingUnit: 'daily',
    minDuration: 1,
    maxDuration: 30,
    securityDeposit: { amount: 200, currency: 'USD', formatted: '$200' },
    requiresPickup: true,
    pricingTiers: [
      { minUnits: 7, pricePerUnit: { amount: 35, currency: 'USD', formatted: '$35' } },
      { minUnits: 14, pricePerUnit: { amount: 28, currency: 'USD', formatted: '$28' } }
    ]
  }
} as any
</script>

<template>
  <ComponentDemo>
    <div class="w-72">
      <CRentalCard :product="product" />
    </div>
  </ComponentDemo>
</template>
