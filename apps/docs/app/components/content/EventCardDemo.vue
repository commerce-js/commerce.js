<script setup lang="ts">
const product = {
  id: 'event_1',
  slug: 'tech-conference-2025',
  name: { en: 'Tech Conference 2025' },
  description: { en: 'Annual technology conference featuring keynotes, workshops, and networking.' },
  type: 'event',
  status: 'active',
  primaryImage: { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop', alt: 'Conference' },
  price: { amount: 149, currency: 'USD', formatted: '$149.00' },
} as any

const event = {
  startDate: '2025-03-15T09:00:00Z',
  endDate: '2025-03-17T18:00:00Z',
  venue: 'Convention Center, San Francisco',
  isVirtual: false,
  capacity: 500,
  registeredCount: 342
}
</script>

<template>
  <ComponentDemo>
    <div class="w-72">
      <CEventCard :product="product" :event="event" />
    </div>
  </ComponentDemo>
</template>
