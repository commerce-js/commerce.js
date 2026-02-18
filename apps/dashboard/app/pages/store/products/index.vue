<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const adminClient = useAdminClient()

const search = ref('')
const page = ref(1)
const perPage = 20

const { data: result, status } = useAsyncData(
  'admin-products',
  () => adminClient.listProducts({
    page: page.value,
    perPage,
    search: search.value || undefined,
  }),
  { watch: [page, search] }
)

const products = computed(() => result.value?.items ?? [])
const total = computed(() => result.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / perPage))

const statusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success' as const
    case 'draft': return 'neutral' as const
    case 'archived': return 'warning' as const
    default: return 'neutral' as const
  }
}

const { formatCurrency } = useFormatCurrency()

// Debounce search
let searchTimeout: ReturnType<typeof setTimeout>
function onSearch(value: string) {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    search.value = value
    page.value = 1
  }, 300)
}
</script>

<template>
  <UDashboardPanel id="store-products">
    <template #header>
      <UDashboardNavbar title="Products">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UInput
            placeholder="Search products..."
            icon="i-lucide-search"
            class="w-64"
            :model-value="search"
            @update:model-value="onSearch"
          />
          <UButton color="primary" icon="i-lucide-plus" label="Add Product" to="/store/products/new" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="status === 'pending'" class="space-y-3 p-4">
        <div v-for="i in 5" :key="i" class="h-12 animate-pulse bg-muted/20 rounded" />
      </div>

      <!-- Data -->
      <template v-else-if="products.length">
        <UTable
          :data="products"
          :columns="[
            { accessorKey: 'name', header: 'Product' },
            { accessorKey: 'sku', header: 'SKU' },
            { accessorKey: 'price', header: 'Price' },
            { accessorKey: 'variants', header: 'Variants' },
            { accessorKey: 'inStock', header: 'Stock' },
          ]"
        >
          <template #name-cell="{ row }">
            <div class="flex items-center gap-3">
              <img
                v-if="row.original.primaryImage?.url"
                :src="row.original.primaryImage.url"
                :alt="row.original.name"
                class="size-8 rounded object-cover"
              />
              <div v-else class="size-8 rounded bg-muted/20 flex items-center justify-center">
                <UIcon name="i-lucide-package" class="text-muted size-4" />
              </div>
              <NuxtLink :to="`/store/products/${row.original.id}`" class="text-primary hover:underline font-medium">
                {{ typeof row.original.name === 'object' ? row.original.name.en || row.original.name.ar : row.original.name }}
              </NuxtLink>
            </div>
          </template>
          <template #sku-cell="{ row }">
            <span class="text-xs font-mono text-muted">{{ row.original.sku || '—' }}</span>
          </template>
          <template #price-cell="{ row }">
            {{ formatCurrency(row.original.price?.current) }}
          </template>
          <template #variants-cell="{ row }">
            {{ row.original.variants?.length ?? 0 }}
          </template>
          <template #inStock-cell="{ row }">
            <UBadge :color="row.original.inStock ? 'success' : 'error'" variant="subtle" size="xs">
              {{ row.original.inStock ? 'In Stock' : 'Out of Stock' }}
            </UBadge>
          </template>
        </UTable>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-default">
          <p class="text-sm text-muted">
            Showing {{ (page - 1) * perPage + 1 }}–{{ Math.min(page * perPage, total) }} of {{ total }}
          </p>
          <div class="flex gap-2">
            <UButton size="xs" variant="outline" :disabled="page <= 1" @click="page--">Previous</UButton>
            <UButton size="xs" variant="outline" :disabled="page >= totalPages" @click="page++">Next</UButton>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-package" class="text-muted size-8 mb-2" />
        <p class="text-muted mb-4">{{ search ? 'No products match your search' : 'No products yet' }}</p>
        <UButton v-if="!search" color="primary" icon="i-lucide-plus" label="Add Your First Product" to="/store/products/new" />
      </div>
    </template>
  </UDashboardPanel>
</template>
