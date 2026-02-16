<script setup lang="ts">
const product = {
  id: 'auction_1',
  slug: 'vintage-watch-1960',
  name: { en: 'Vintage Omega Seamaster 1960' },
  type: 'auction',
  status: 'active',
  primaryImage: { url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop', alt: 'Vintage Watch' },
  price: { amount: 2500, currency: 'USD', formatted: '$2,500.00' },
} as any

const auction = {
  startingPrice: { amount: 1000, currency: 'USD', formatted: '$1,000' },
  currentBid: { amount: 2500, currency: 'USD', formatted: '$2,500' },
  bidCount: 14,
  endsAt: new Date(Date.now() + 2 * 86400000).toISOString(),
  status: 'active'
}
</script>

<template>
  <ComponentDemo>
    <div class="w-72">
      <CAuctionCard :product="product" :auction="auction" />
    </div>
  </ComponentDemo>
</template>
