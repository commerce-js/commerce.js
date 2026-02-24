<script setup lang="ts">
const { t } = useLocalizedString()

const open = defineModel<boolean>('open', { default: false })
const searchTerm = ref('')

defineShortcuts({
  meta_k: () => { open.value = true },
})

// Fetch products matching search term
const { data: searchResults, status: searchStatus } = useFetch('/api/_commerce/products', {
  key: 'search-products',
  params: { query: searchTerm },
  transform: (data: any) => {
    return (data?.products?.items ?? []).map((p: any) => ({
      id: p.id,
      label: t(p.name),
      suffix: p.price?.formatted || undefined,
      avatar: p.images?.[0] ? { src: p.images[0].url } : undefined,
      to: `/products/${p.slug || p.id}`,
    }))
  },
  lazy: true,
  watch: [searchTerm],
})

const groups = computed(() => [{
  id: 'products',
  label: searchTerm.value ? `Results for "${searchTerm.value}"` : 'Products',
  items: searchResults.value || [],
  ignoreFilter: true,
}])

function onSelect(item: any) {
  if (item?.to) {
    open.value = false
    searchTerm.value = ''
    navigateTo(item.to)
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <slot />

    <template #content>
      <UCommandPalette
        v-model:search-term="searchTerm"
        :loading="searchStatus === 'pending'"
        :groups="groups"
        placeholder="Search products..."
        class="h-80"
        @update:model-value="onSelect"
      />
    </template>
  </UModal>
</template>
