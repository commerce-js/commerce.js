<script setup lang="ts">
const facets = [
  {
    code: 'category',
    name: { en: 'Category' },
    values: [
      { value: 'electronics', label: { en: 'Electronics' }, count: 45 },
      { value: 'clothing', label: { en: 'Clothing' }, count: 32 },
      { value: 'accessories', label: { en: 'Accessories' }, count: 28 },
      { value: 'home', label: { en: 'Home & Garden' }, count: 19 },
      { value: 'sports', label: { en: 'Sports' }, count: 12 },
      { value: 'books', label: { en: 'Books' }, count: 8 },
    ]
  },
  {
    code: 'brand',
    name: { en: 'Brand' },
    values: [
      { value: 'apple', label: { en: 'Apple' }, count: 15 },
      { value: 'samsung', label: { en: 'Samsung' }, count: 12 },
      { value: 'sony', label: { en: 'Sony' }, count: 9 },
      { value: 'nike', label: { en: 'Nike' }, count: 7 },
    ]
  },
  {
    code: 'price_range',
    name: { en: 'Price Range' },
    values: [
      { value: 'under_50', label: { en: 'Under $50' }, count: 34 },
      { value: '50_100', label: { en: '$50 - $100' }, count: 28 },
      { value: '100_250', label: { en: '$100 - $250' }, count: 19 },
      { value: 'over_250', label: { en: 'Over $250' }, count: 11 },
    ]
  }
] as any

const selected = ref({
  category: ['electronics'],
  brand: [],
  price_range: []
})
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-xs">
      <CCategoryFilter v-model="selected" :facets="facets" show-counts />
    </div>
  </ComponentDemo>
</template>
