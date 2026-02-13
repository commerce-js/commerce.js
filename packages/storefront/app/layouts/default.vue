<script setup lang="ts">
const { t } = useLocalizedString()
const { data: categories } = await useCategories()

const { cart, itemCount, updateItem, removeItem, onItemAdded } = useCart()

// Cart drawer state
const cartDrawerOpen = ref(false)

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
  <div class="min-h-screen flex flex-col bg-(--ui-bg)">
    <!-- Header -->
    <header class="sticky top-0 z-50 border-b border-(--ui-border) bg-(--ui-bg)/80 backdrop-blur-xl">
      <UContainer>
        <nav class="flex items-center justify-between h-16 gap-4">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
            <UIcon name="i-heroicons-shopping-bag-20-solid" class="text-2xl text-(--ui-primary)" />
            <span class="text-lg font-bold text-(--ui-text-highlighted)">
              CommerceJS
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
            <UButton
              to="/products"
              icon="i-heroicons-magnifying-glass-20-solid"
              variant="ghost"
              color="neutral"
              size="sm"
              aria-label="Search products"
            />

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

    <!-- Main content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-(--ui-border) bg-(--ui-bg-elevated) mt-auto">
      <UContainer>
        <div class="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Brand column -->
          <div class="md:col-span-1">
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-shopping-bag-20-solid" class="text-xl text-(--ui-primary)" />
              <span class="font-bold text-(--ui-text-highlighted)">CommerceJS</span>
            </div>
            <p class="text-sm text-(--ui-text-muted)">
              A premium storefront experience powered by the CommerceJS SDK.
            </p>
          </div>

          <!-- Shop column -->
          <div>
            <h4 class="font-semibold text-sm text-(--ui-text-highlighted) mb-3 uppercase tracking-wider">Shop</h4>
            <ul class="space-y-2">
              <li><NuxtLink to="/products" class="text-sm text-(--ui-text-muted) hover:text-(--ui-primary) transition-colors">All Products</NuxtLink></li>
              <li v-for="cat in (categories || []).slice(0, 3)" :key="cat.id">
                <NuxtLink :to="`/categories/${cat.slug}`" class="text-sm text-(--ui-text-muted) hover:text-(--ui-primary) transition-colors">
                  {{ t(cat.name) }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Support column -->
          <div>
            <h4 class="font-semibold text-sm text-(--ui-text-highlighted) mb-3 uppercase tracking-wider">Support</h4>
            <ul class="space-y-2">
              <li><NuxtLink to="/cart" class="text-sm text-(--ui-text-muted) hover:text-(--ui-primary) transition-colors">Shopping Cart</NuxtLink></li>
              <li><NuxtLink to="/checkout" class="text-sm text-(--ui-text-muted) hover:text-(--ui-primary) transition-colors">Checkout</NuxtLink></li>
            </ul>
          </div>

          <!-- Newsletter column -->
          <div>
            <h4 class="font-semibold text-sm text-(--ui-text-highlighted) mb-3 uppercase tracking-wider">Stay Updated</h4>
            <p class="text-sm text-(--ui-text-muted) mb-3">Get notified about new arrivals and offers.</p>
            <div class="flex gap-2">
              <UInput placeholder="Your email" size="sm" class="flex-1" />
              <UButton size="sm" color="primary">Subscribe</UButton>
            </div>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="border-t border-(--ui-border) py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p class="text-xs text-(--ui-text-muted)">
            &copy; {{ new Date().getFullYear() }} CommerceJS. All rights reserved.
          </p>
          <p class="text-xs text-(--ui-text-dimmed)">
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
