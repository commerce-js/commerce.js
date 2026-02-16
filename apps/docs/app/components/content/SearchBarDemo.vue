<script setup lang="ts">
const loading = ref(false)

const groups = ref([
  {
    id: 'products',
    label: 'Products',
    items: [
      { label: 'iPhone 15 Pro Max', icon: 'i-heroicons-device-phone-mobile', suffix: '$1,199' },
      { label: 'iPad Air M2', icon: 'i-heroicons-device-tablet', suffix: '$599' },
      { label: 'MacBook Pro 16"', icon: 'i-heroicons-computer-desktop', suffix: '$2,499' },
      { label: 'AirPods Pro', icon: 'i-heroicons-speaker-wave', suffix: '$249' },
      { label: 'Apple Watch Ultra', icon: 'i-heroicons-clock', suffix: '$799' },
      { label: 'Samsung Galaxy S24', icon: 'i-heroicons-device-phone-mobile', suffix: '$899' },
      { label: 'Sony WH-1000XM5', icon: 'i-heroicons-speaker-wave', suffix: '$349' },
    ],
  },
  {
    id: 'categories',
    label: 'Categories',
    items: [
      { label: 'Electronics', icon: 'i-heroicons-bolt' },
      { label: 'Clothing', icon: 'i-heroicons-shopping-bag' },
      { label: 'Accessories', icon: 'i-heroicons-sparkles' },
    ],
  },
])
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-lg">
      <CSearchBar
        placeholder="Search products..."
        :groups="groups"
        :loading="loading"
      />
    </div>
  </ComponentDemo>
</template>
