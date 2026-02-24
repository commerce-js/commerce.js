<script setup lang="ts">
const route = useRoute()
const { t } = useLocalizedString()

const slug = computed(() => route.params.slug as string)

// Fetch all categories to find this one
const { data: allCategories } = useCategories()

const category = computed(() => {
  const find = (cats: any[]): any => {
    for (const c of cats) {
      if (c.slug === slug.value) return c
      if (c.children?.length) {
        const found = find(c.children)
        if (found) return found
      }
    }
    return null
  }
  return allCategories.value ? find(allCategories.value) : null
})

// Fetch products for this category
const searchParams = computed(() => ({
  categoryId: category.value?.id,
  page: Number(route.query.page) || 1,
  perPage: 12,
}))

const { data: result, status } = useProducts(searchParams)
const products = computed(() => result.value?.products?.items ?? [])
const pagination = computed(() => result.value?.products ?? { total: 0, page: 1, perPage: 12, hasMore: false })

function goToPage(page: number) {
  navigateTo({ path: route.path, query: { page: String(page) } })
}

useHead({ title: computed(() => category.value ? `${t(category.value.name)} — CommerceJS` : 'Category') })
</script>

<template>
  <UContainer class="py-8 md:py-12">
    <UBreadcrumb
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Products', to: '/products' },
        { label: category ? t(category.name) : 'Category' },
      ]"
      class="mb-8"
    />

    <!-- Category header -->
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-highlighted">
        {{ category ? t(category.name) : 'Category' }}
      </h1>
      <p v-if="category?.description" class="text-muted mt-2">
        {{ t(category.description) }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="status === 'pending'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      <div v-for="i in 8" :key="i" class="rounded-xl bg-elevated border border-default animate-pulse aspect-3/4" />
    </div>

    <!-- Empty -->
    <div v-else-if="products.length === 0" class="text-center py-24">
      <UIcon name="i-heroicons-cube-transparent" class="text-5xl text-dimmed mb-4" />
      <h3 class="text-lg font-semibold text-highlighted mb-2">No products in this category</h3>
      <UButton to="/products" variant="outline" color="primary" class="mt-4">Browse All Products</UButton>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
  </UContainer>
</template>
