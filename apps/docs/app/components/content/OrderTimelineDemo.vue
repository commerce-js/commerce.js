<script setup lang="ts">
const entries = [
  { status: 'delivered', timestamp: '2024-12-20T15:30:00Z', note: 'Package was handed to the recipient' },
  { status: 'shipped', timestamp: '2024-12-19T12:00:00Z', note: 'Package arrived at local delivery facility' },
  { status: 'shipped', timestamp: '2024-12-18T18:00:00Z', note: 'Package in transit — left sorting center' },
  { status: 'processing', timestamp: '2024-12-18T09:30:00Z', note: 'Order is being packed and labeled' },
  { status: 'pending', timestamp: '2024-12-17T14:00:00Z', note: 'We received your order' }
] as any
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-sm">
      <COrderTimeline :entries="entries" />
    </div>
  </ComponentDemo>
</template>
