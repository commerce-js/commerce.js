<script setup lang="ts">
const { t } = useLocalizedString()

// Fetch featured products (first page, limited)
// await + lazy:true = blocks SSR (complete HTML), doesn't block SPA navigation
const { data: productsResult } = await useProducts({ perPage: 8 })
const featuredProducts = computed(() => productsResult.value?.products?.items ?? [])

// Fetch categories
const { data: categories } = await useCategories()
const topCategories = computed(() => categories.value?.slice(0, 6) ?? [])

// Store info
const { store, refresh: refreshStore } = useStoreInfo()
refreshStore()
const storeName = computed(() => t(store.value?.name) || 'CommerceJS')

// SEO
useSeoMeta({
  title: () => `${storeName.value} — Premium Storefront`,
  ogTitle: () => `${storeName.value} — Premium Storefront`,
  description: 'Discover premium products with the best prices. Fast delivery, secure payments, easy returns.',
  ogDescription: 'Discover premium products with the best prices. Fast delivery, secure payments, easy returns.',
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <!-- Gradient background -->
      <div class="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-secondary/10" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--ui-primary)_0%,transparent_50%)] opacity-5" />

      <UContainer class="relative">
        <div class="py-24 md:py-32 lg:py-40 max-w-3xl">
          <UBadge color="primary" variant="subtle" size="lg" class="mb-6">
            <UIcon name="i-heroicons-sparkles-20-solid" class="mr-1" />
            New Collection Available
          </UBadge>

          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-highlighted leading-tight mb-6">
            Discover
            <span class="text-primary">Premium</span>
            Products
          </h1>

          <p class="text-lg md:text-xl text-muted mb-8 max-w-xl">
            Browse our curated collection of the finest products, delivered directly to your door with care.
          </p>

          <div class="flex flex-wrap gap-3">
            <UButton to="/products" size="xl" color="primary">
              <UIcon name="i-heroicons-shopping-bag-20-solid" class="mr-2" />
              Shop Now
            </UButton>
            <UButton to="/products" size="xl" variant="outline" color="neutral">
              Browse Categories
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Featured Products -->
    <section class="py-16 md:py-24">
      <UContainer>
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl md:text-3xl font-bold text-highlighted">
              Featured Products
            </h2>
            <p class="text-muted mt-1">Handpicked for you</p>
          </div>
          <UButton to="/products" variant="ghost" color="primary" trailing-icon="i-heroicons-arrow-right-20-solid">
            View All
          </UButton>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <ProductCard
            v-for="product in featuredProducts"
            :key="product.id"
            :product="product"
          />
        </div>
      </UContainer>
    </section>

    <!-- Category Grid -->
    <section class="py-16 md:py-24 bg-elevated">
      <UContainer>
        <div class="text-center mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-highlighted">
            Shop by Category
          </h2>
          <p class="text-muted mt-2">Find exactly what you're looking for</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <NuxtLink
            v-for="cat in topCategories"
            :key="cat.id"
            :to="`/categories/${cat.slug || cat.id}`"
            class="group relative rounded-2xl overflow-hidden aspect-4/3 bg-accented border border-default hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
          >
            <!-- Category image -->
            <img
              v-if="cat.image"
              :src="cat.image.url"
              :alt="cat.image.alt || t(cat.name)"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div v-else class="absolute inset-0 bg-linear-to-br from-primary/20 to-secondary/20" />

            <!-- Overlay -->
            <div class="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

            <!-- Content -->
            <div class="absolute bottom-0 left-0 right-0 p-4 md:p-6">
              <h3 class="font-bold text-white text-lg md:text-xl">
                {{ t(cat.name) }}
              </h3>
              <p v-if="cat.productCount" class="text-white/70 text-sm mt-1">
                {{ cat.productCount }} products
              </p>
            </div>
          </NuxtLink>
        </div>
      </UContainer>
    </section>

    <!-- Value Propositions -->
    <section class="py-16 md:py-24">
      <UContainer>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-6 rounded-2xl bg-elevated border border-default">
            <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
              <UIcon name="i-heroicons-truck-20-solid" class="text-2xl text-primary" />
            </div>
            <h3 class="font-semibold text-highlighted mb-2">Fast Delivery</h3>
            <p class="text-sm text-muted">Free shipping on orders above SAR 200</p>
          </div>

          <div class="text-center p-6 rounded-2xl bg-elevated border border-default">
            <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
              <UIcon name="i-heroicons-shield-check-20-solid" class="text-2xl text-primary" />
            </div>
            <h3 class="font-semibold text-highlighted mb-2">Secure Payments</h3>
            <p class="text-sm text-muted">100% secure checkout with multiple options</p>
          </div>

          <div class="text-center p-6 rounded-2xl bg-elevated border border-default">
            <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
              <UIcon name="i-heroicons-arrow-path-20-solid" class="text-2xl text-primary" />
            </div>
            <h3 class="font-semibold text-highlighted mb-2">Easy Returns</h3>
            <p class="text-sm text-muted">30-day hassle-free return policy</p>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>
