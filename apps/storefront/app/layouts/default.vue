<script setup lang="ts">
const { t } = useLocalizedString()
const { data: categories } = await useCategories()

const { cart, itemCount, updateItem, removeItem, onItemAdded } = useCart()
const { store } = useStoreInfo()

// Store name with fallback
const storeName = computed(() => t(store.value?.name) || 'CommerceJS')

// Cart drawer state
const cartDrawerOpen = ref(false)

// Mobile menu state
const mobileMenuOpen = ref(false)

// Open drawer whenever an item is added to cart
onItemAdded(() => {
  cartDrawerOpen.value = true
})

// Drawer event handlers
function handleDrawerUpdateQuantity(itemId: string, quantity: number) {
  updateItem(itemId, quantity)
}
function handleDrawerRemove(itemId: string) {
  removeItem(itemId)
}

// Navigation links
const navLinks = computed(() => {
  const links = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
  ]

  // Add top-level categories as nav items
  if (categories.value) {
    for (const cat of categories.value.slice(0, 5)) {
      links.push({
        label: t(cat.name),
        to: `/categories/${cat.slug}`,
      })
    }
  }

  return links
})

const cartBadge = computed(() =>
  itemCount.value > 0 ? String(itemCount.value) : undefined,
)
</script>

<template>
  <div class="min-h-screen flex flex-col bg-default">
    <!-- Header -->
    <header class="sticky top-0 z-50 border-b border-default bg-default/80 backdrop-blur-xl">
      <UContainer>
        <nav class="flex items-center justify-between h-16 gap-4">
          <!-- Mobile hamburger (visible on small screens) -->
          <UButton
            class="md:hidden"
            icon="i-heroicons-bars-3-20-solid"
            variant="ghost"
            color="neutral"
            size="sm"
            aria-label="Open navigation menu"
            @click="mobileMenuOpen = true"
          />

          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
            <UIcon name="i-heroicons-shopping-bag-20-solid" class="text-2xl text-primary" />
            <span class="text-lg font-bold text-highlighted">
              {{ storeName }}
            </span>
          </NuxtLink>

          <!-- Nav links (hidden on mobile) -->
          <div class="hidden md:flex items-center gap-1">
            <UButton
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              variant="ghost"
              color="neutral"
              size="sm"
            >
              {{ link.label }}
            </UButton>
          </div>

          <!-- Right side: search + cart -->
          <div class="flex items-center gap-2">
            <ClientOnly>
              <SearchPalette>
                <UButton
                  icon="i-heroicons-magnifying-glass-20-solid"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  aria-label="Search products"
                />
              </SearchPalette>
              <template #fallback>
                <UButton
                  to="/products"
                  icon="i-heroicons-magnifying-glass-20-solid"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  aria-label="Search products"
                />
              </template>
            </ClientOnly>

            <UButton
              to="/cart"
              icon="i-heroicons-shopping-cart-20-solid"
              variant="ghost"
              color="neutral"
              size="sm"
              :badge="cartBadge"
              :badge-color="itemCount > 0 ? 'primary' : undefined"
              aria-label="Cart"
            />

            <UColorModeButton size="sm" />
          </div>
        </nav>
      </UContainer>
    </header>


    <!-- Mobile Menu Slideover -->
    <USlideover v-model:open="mobileMenuOpen" side="left" title="Menu">
      <template #body>
        <nav class="flex flex-col gap-1 py-2">
          <UButton
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            variant="ghost"
            color="neutral"
            size="lg"
            block
            class="justify-start"
            @click="mobileMenuOpen = false"
          >
            {{ link.label }}
          </UButton>
        </nav>
      </template>
    </USlideover>

    <!-- Main content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-default bg-elevated mt-auto">
      <UContainer>
        <div class="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Brand column -->
          <div class="md:col-span-1">
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-shopping-bag-20-solid" class="text-xl text-primary" />
              <span class="font-bold text-highlighted">{{ storeName }}</span>
            </div>
            <p class="text-sm text-muted">
              A premium storefront experience powered by CommerceJS.
            </p>
          </div>

          <!-- Shop column -->
          <div>
            <h4 class="font-semibold text-sm text-highlighted mb-3 uppercase tracking-wider">Shop</h4>
            <ul class="space-y-2">
              <li><NuxtLink to="/products" class="text-sm text-muted hover:text-primary transition-colors">All Products</NuxtLink></li>
              <li v-for="cat in (categories || []).slice(0, 3)" :key="cat.id">
                <NuxtLink :to="`/categories/${cat.slug}`" class="text-sm text-muted hover:text-primary transition-colors">
                  {{ t(cat.name) }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Support column -->
          <div>
            <h4 class="font-semibold text-sm text-highlighted mb-3 uppercase tracking-wider">Support</h4>
            <ul class="space-y-2">
              <li><NuxtLink to="/cart" class="text-sm text-muted hover:text-primary transition-colors">Shopping Cart</NuxtLink></li>
              <li><NuxtLink to="/checkout" class="text-sm text-muted hover:text-primary transition-colors">Checkout</NuxtLink></li>
            </ul>
          </div>

          <!-- Newsletter column -->
          <div>
            <h4 class="font-semibold text-sm text-highlighted mb-3 uppercase tracking-wider">Stay Updated</h4>
            <p class="text-sm text-muted mb-3">Get notified about new arrivals and offers.</p>
            <div class="flex gap-2">
              <UInput placeholder="Your email" size="sm" class="flex-1" />
              <UButton size="sm" color="primary">Subscribe</UButton>
            </div>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="border-t border-default py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p class="text-xs text-muted">
            &copy; {{ new Date().getFullYear() }} {{ storeName }}. All rights reserved.
          </p>
          <p class="text-xs text-dimmed">
            Built with Nuxt + CommerceJS SDK
          </p>
        </div>
      </UContainer>
    </footer>
    <!-- Cart Drawer -->
    <CCartDrawer
      v-model:open="cartDrawerOpen"
      :cart="cart"
      :loading="false"
      @update:quantity="handleDrawerUpdateQuantity"
      @remove="handleDrawerRemove"
    />
  </div>
</template>
