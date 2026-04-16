<script setup lang="ts">
const { t } = useLocalizedString()

const open = defineModel<boolean>('open', { default: false })
const searchTerm = ref('')

defineShortcuts({
  meta_k: () => { open.value = true },
})

// Fetch products matching search term. useProducts composable reads the
// runtime apiBase (remote mode → proxied /api/storefront, local mode →
// /api/_commerce), so we don't hardcode the namespace here.
const searchParams = computed(() => ({ query: searchTerm.value }))
const { data: searchData, status: searchStatus } = useProducts(searchParams)

const searchResults = computed(() =>
  (searchData.value?.products?.items ?? []).map((p: any) => ({
    id: p.id,
    label: t(p.name),
    suffix: p.price?.formatted || undefined,
    avatar: p.primaryImage ? { src: p.primaryImage.url } : undefined,
    to: `/products/${p.slug || p.id}`,
  })),
)

const groups = computed(() => [{
  id: 'products',
  label: searchTerm.value ? `Results for "${searchTerm.value}"` : 'Products',
  items: searchResults.value,
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
