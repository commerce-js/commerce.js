<script setup lang="ts">
const { t } = useLocalizedString()
const { formatPrice } = usePrice()
const { cart, loading, updateItem, removeItem, refresh, itemCount, createCart, cartId } = useCart()

// await + lazy = blocks SSR, doesn't block SPA navigation
// getCachedData: () => undefined forces re-fetch on every visit
await useLazyAsyncData('cart-page', async () => {
  if (cartId.value) await refresh()
  return true
}, {
  getCachedData: () => undefined,
})

const cartItems = computed(() => cart.value?.items ?? [])

async function handleUpdateQuantity(itemId: string, qty: number) {
  if (qty < 1) return
  await updateItem(itemId, qty)
}

async function handleRemove(itemId: string) {
  await removeItem(itemId)
}

// Format totals
const subtotal = computed(() => cart.value?.totals?.subtotal)
const total = computed(() => cart.value?.totals?.total)

useHead({ title: 'Cart — CommerceJS' })
</script>

<template>
  <UContainer class="py-8 md:py-12">
    <UBreadcrumb
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Shopping Cart' },
      ]"
      class="mb-8"
    />

    <h1 class="text-2xl md:text-3xl font-bold text-highlighted mb-8">
      Shopping Cart
    </h1>

    <!-- Loading cart data -->
    <div v-if="loading && !cart" class="space-y-4">
      <div v-for="i in 2" :key="i" class="flex gap-4 p-4 rounded-xl bg-elevated ring ring-default animate-pulse">
        <div class="w-24 h-24 rounded-lg bg-accented" />
        <div class="flex-1 space-y-3">
          <div class="h-4 w-1/3 rounded bg-accented" />
          <div class="h-3 w-1/4 rounded bg-accented" />
          <div class="h-8 w-24 rounded bg-accented" />
        </div>
      </div>
    </div>

    <!-- Empty cart -->
    <CEmptyState
      v-else-if="!cart || cartItems.length === 0"
      icon="i-heroicons-shopping-cart"
      title="Your cart is empty"
      description="Start shopping to add items to your cart"
      action-label="Browse Products"
      action-to="/products"
    />

    <!-- Cart with items -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Cart items -->
      <div class="lg:col-span-2 space-y-4">
        <div
          v-for="item in cartItems"
          :key="item.id"
          class="flex gap-4 p-4 rounded-xl bg-elevated ring ring-default"
        >
          <!-- Item image -->
          <NuxtLink :to="`/products/${item.productId}`" class="shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-accented">
            <img
              v-if="item.image"
              :src="item.image.url"
              :alt="item.image.alt || t(item.name)"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </NuxtLink>

          <!-- Item details -->
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/products/${item.productId}`" class="font-medium text-highlighted hover:text-primary transition-colors line-clamp-1">
              {{ t(item.name) }}
            </NuxtLink>

            <p v-if="item.variantName" class="text-xs text-muted mt-0.5">
              {{ t(item.variantName) }}
            </p>

            <CProductPrice v-if="item.price" :price="item.price" size="sm" class="mt-1" />

            <div class="flex items-center justify-between mt-3">
              <CQuantitySelector
                :model-value="item.quantity"
                :min="1"
                :disabled="loading"
                size="sm"
                @update:model-value="handleUpdateQuantity(item.id, $event)"
              />

              <!-- Remove -->
              <UButton
                icon="i-heroicons-trash-20-solid"
                variant="ghost"
                color="error"
                size="xs"
                :loading="loading"
                @click="handleRemove(item.id)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Order summary -->
      <div class="lg:col-span-1">
        <div class="sticky top-20 rounded-2xl bg-elevated ring ring-default p-6 space-y-4">
          <h3 class="font-semibold text-highlighted text-lg">Order Summary</h3>

          <USeparator />

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted">Subtotal ({{ itemCount }} items)</span>
              <span class="font-medium">{{ formatPrice(subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Shipping</span>
              <span class="text-dimmed">Calculated at checkout</span>
            </div>
          </div>

          <USeparator />

          <div class="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span class="text-primary">{{ formatPrice(total) }}</span>
          </div>

          <UButton
            to="/checkout"
            block
            size="lg"
            color="primary"
            class="mt-4"
          >
            Proceed to Checkout
          </UButton>

          <UButton
            to="/products"
            block
            variant="ghost"
            color="neutral"
            size="sm"
          >
            Continue Shopping
          </UButton>
        </div>
      </div>
    </div>
  </UContainer>
</template>
