<script setup lang="ts">
const route = useRoute()
const { t } = useLocalizedString()

// Search params from route query
const searchParams = computed(() => ({
  query: (route.query.q as string) || undefined,
  categoryId: (route.query.category as string) || undefined,
  page: Number(route.query.page) || 1,
  perPage: 12,
  sort: route.query.sort
    ? { field: (route.query.sort as string).replace('-desc', '').replace('-asc', ''), direction: (route.query.sort as string).endsWith('-desc') ? 'desc' as const : 'asc' as const }
    : undefined,
}))

const { data: result, status } = useProducts(searchParams)
const products = computed(() => result.value?.products?.items ?? [])
const pagination = computed(() => result.value?.products ?? { total: 0, page: 1, perPage: 12, hasMore: false })

// Categories for sidebar filter
const { data: categories } = useCategories()

// Sort options
const sortOptions = [
  { label: 'Newest', value: 'date-desc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name A→Z', value: 'name-asc' },
]
const selectedSort = ref((route.query.sort as string) || 'date-desc')

// Search query
const searchQuery = ref((route.query.q as string) || '')

// Apply filters
function applyFilters() {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  if (route.query.category) query.category = route.query.category as string
  if (selectedSort.value !== 'date-desc') query.sort = selectedSort.value
  navigateTo({ path: '/products', query })
}

watch(selectedSort, applyFilters)

function onSearch() {
  applyFilters()
}

function goToPage(page: number) {
  const query = { ...route.query, page: String(page) }
  navigateTo({ path: '/products', query })
}

// SEO
useHead({
  title: 'Products — CommerceJS',
  meta: [
    { name: 'description', content: 'Browse all products in our store.' },
  ],
})
</script>

<template>
  <UContainer class="py-8 md:py-12">
    <!-- Breadcrumb -->
    <UBreadcrumb
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Products' },
      ]"
      class="mb-6"
    />

    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Sidebar Filters -->
      <aside class="w-full lg:w-64 shrink-0">
        <div class="sticky top-20 space-y-6">
          <!-- Search -->
          <div>
            <h3 class="text-sm font-semibold text-highlighted mb-3 uppercase tracking-wider">Search</h3>
            <form @submit.prevent="onSearch">
              <UInput
                v-model="searchQuery"
                placeholder="Search products..."
                icon="i-heroicons-magnifying-glass-20-solid"
                size="md"
              />
            </form>
          </div>

          <!-- Categories -->
          <div>
            <h3 class="text-sm font-semibold text-highlighted mb-3 uppercase tracking-wider">Categories</h3>
            <div class="space-y-1">
              <NuxtLink
                to="/products"
                class="block px-3 py-2 rounded-lg text-sm transition-colors"
                :class="!route.query.category ? 'bg-primary/10 text-primary font-medium' : 'text-muted hover:bg-elevated'"
              >
                All Products
              </NuxtLink>
              <NuxtLink
                v-for="cat in categories"
                :key="cat.id"
                :to="{ path: '/products', query: { category: cat.id } }"
                class="block px-3 py-2 rounded-lg text-sm transition-colors"
                :class="route.query.category === cat.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted hover:bg-elevated'"
              >
                {{ t(cat.name) }}
                <span v-if="cat.productCount" class="text-xs text-dimmed ml-1">({{ cat.productCount }})</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </aside>

      <!-- Products grid -->
      <div class="flex-1 min-w-0">
        <!-- Top bar -->
        <div class="flex items-center justify-between mb-6 gap-4">
          <p class="text-sm text-muted">
            <span class="font-medium text-highlighted">{{ pagination.total }}</span> products found
          </p>

          <USelect
            v-model="selectedSort"
            :items="sortOptions"
            value-key="value"
            size="sm"
            class="w-48"
          />
        </div>

        <!-- Loading state -->
        <div v-if="status === 'pending'" class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div v-for="i in 6" :key="i" class="rounded-xl bg-elevated border border-default animate-pulse aspect-3/4" />
        </div>

        <!-- Empty state -->
        <div v-else-if="products.length === 0" class="text-center py-24">
          <UIcon name="i-heroicons-magnifying-glass" class="text-5xl text-dimmed mb-4" />
          <h3 class="text-lg font-semibold text-highlighted mb-2">No products found</h3>
          <p class="text-muted mb-6">Try adjusting your search or filters</p>
          <UButton to="/products" variant="outline" color="primary">Clear Filters</UButton>
        </div>

        <!-- Product grid -->
        <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>

        <!-- Pagination -->
        <div v-if="pagination.total > pagination.perPage" class="mt-8 flex justify-center">
          <UPagination
            :page="pagination.page"
            :total="pagination.total"
            :items-per-page="pagination.perPage"
            @update:page="goToPage"
          />
        </div>
      </div>
    </div>
  </UContainer>
</template>
