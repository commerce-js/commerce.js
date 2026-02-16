<script setup lang="ts">
const rental = {
  pricePerUnit: { amount: 45, currency: 'USD', formatted: '$45' },
  pricingUnit: 'daily',
  minDuration: 2,
  maxDuration: 30,
  securityDeposit: { amount: 200, currency: 'USD', formatted: '$200' },
  pricingTiers: [
    { minUnits: 7, pricePerUnit: { amount: 35, currency: 'USD', formatted: '$35' } },
    { minUnits: 14, pricePerUnit: { amount: 28, currency: 'USD', formatted: '$28' } }
  ]
} as any
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-md">
      <CRentalBookingForm :rental="rental" product-id="rental_1" />
    </div>
  </ComponentDemo>
</template>
