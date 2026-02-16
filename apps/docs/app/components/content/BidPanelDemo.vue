<script setup lang="ts">
const auction = {
  startingPrice: { amount: 1000, currency: 'USD', formatted: '$1,000' },
  currentBid: { amount: 2500, currency: 'USD', formatted: '$2,500' },
  bidCount: 14,
  bidIncrement: { amount: 100, currency: 'USD', formatted: '$100' },
  endsAt: new Date(Date.now() + 2 * 86400000).toISOString(),
  reservePrice: { amount: 5000, currency: 'USD', formatted: '$5,000' },
  status: 'active',
  autoBiddingEnabled: true,
  buyNowPrice: { amount: 6000, currency: 'USD', formatted: '$6,000' }
} as any

const bids = [
  { id: 'b1', amount: { amount: 2500, currency: 'USD', formatted: '$2,500' }, bidderName: 'john_d', isWinning: true, timestamp: '2024-12-20T14:30:00Z' },
  { id: 'b2', amount: { amount: 2200, currency: 'USD', formatted: '$2,200' }, bidderName: 'jane_s', isWinning: false, timestamp: '2024-12-20T12:15:00Z' },
  { id: 'b3', amount: { amount: 1800, currency: 'USD', formatted: '$1,800' }, bidderName: 'mike_r', isWinning: false, timestamp: '2024-12-19T22:00:00Z' },
] as any
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-sm">
      <CBidPanel :auction="auction" :bids="bids" currency-symbol="$" />
    </div>
  </ComponentDemo>
</template>
