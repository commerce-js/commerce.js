<script setup lang="ts">
const items = [
  {
    id: 'opt_size',
    name: { en: 'Size' },
    values: [
      { id: 'xs', name: { en: 'XS' } },
      { id: 's', name: { en: 'S' } },
      { id: 'm', name: { en: 'M' } },
      { id: 'l', name: { en: 'L' } },
      { id: 'xl', name: { en: 'XL' } }
    ]
  },
  {
    id: 'opt_color',
    name: { en: 'Color' },
    values: [
      { id: 'black', name: { en: 'Black' } },
      { id: 'white', name: { en: 'White' } },
      { id: 'navy', name: { en: 'Navy' } }
    ]
  }
] as any

const selected = ref<Record<string, string>>({
  opt_size: 'm',
  opt_color: 'black'
})
</script>

<template>
  <ComponentDemo>
    <div class="w-full max-w-sm">
      <CProductOptions v-model="selected" :items="items" />
    </div>
  </ComponentDemo>
</template>
