<script setup lang="ts">
const { t } = useLocalizedString()
const { formatPrice } = usePrice()
const { cart, loading, updateItem, removeItem, refresh, itemCount, createCart, cartId } = useCart()

// Fetch cart on page load
if (cartId.value) {
  await refresh()
}

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

    <h1 class="text-2xl md:text-3xl font-bold text-(--ui-text-highlighted) mb-8">
      Shopping Cart
    </h1>

    <!-- Empty cart -->
    <div v-if="!cart || cartItems.length === 0" class="text-center py-24">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-(--ui-primary)/10 flex items-center justify-center">
        <UIcon name="i-heroicons-shopping-cart" class="text-4xl text-(--ui-primary)" />
      </div>
      <h2 class="text-xl font-semibold text-(--ui-text-highlighted) mb-2">Your cart is empty</h2>
      <p class="text-(--ui-text-muted) mb-6">Start shopping to add items to your cart</p>
      <UButton to="/products" size="lg" color="primary">
        <UIcon name="i-heroicons-shopping-bag-20-solid" class="mr-2" />
        Browse Products
      </UButton>
    </div>

    <!-- Cart with items -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Cart items -->
      <div class="lg:col-span-2 space-y-4">
        <div
          v-for="item in cartItems"
          :key="item.id"
          class="flex gap-4 p-4 rounded-xl bg-(--ui-bg-elevated) border border-(--ui-border)"
        >
          <!-- Item image -->
          <NuxtLink :to="`/products/${item.productId}`" class="shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-(--ui-bg-accented)">
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
            <NuxtLink :to="`/products/${item.productId}`" class="font-medium text-(--ui-text-highlighted) hover:text-(--ui-primary) transition-colors line-clamp-1">
              {{ t(item.name) }}
            </NuxtLink>

            <p v-if="item.variantName" class="text-xs text-(--ui-text-muted) mt-0.5">
              {{ t(item.variantName) }}
            </p>

            <p class="text-sm font-semibold text-(--ui-primary) mt-1">
              {{ formatPrice(item.price) }}
            </p>

            <div class="flex items-center justify-between mt-3">
              <!-- Quantity controls -->
              <div class="flex items-center gap-1">
                <UButton
                  icon="i-heroicons-minus-20-solid"
                  variant="outline"
                  color="neutral"
                  size="xs"
                  :disabled="item.quantity <= 1 || loading"
                  @click="handleUpdateQuantity(item.id, item.quantity - 1)"
                />
                <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
                <UButton
                  icon="i-heroicons-plus-20-solid"
                  variant="outline"
                  color="neutral"
                  size="xs"
                  :disabled="loading"
                  @click="handleUpdateQuantity(item.id, item.quantity + 1)"
                />
              </div>

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
        <div class="sticky top-20 rounded-2xl bg-(--ui-bg-elevated) border border-(--ui-border) p-6 space-y-4">
          <h3 class="font-semibold text-(--ui-text-highlighted) text-lg">Order Summary</h3>

          <USeparator />

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-(--ui-text-muted)">Subtotal ({{ itemCount }} items)</span>
              <span class="font-medium">{{ formatPrice(subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-(--ui-text-muted)">Shipping</span>
              <span class="text-(--ui-text-dimmed)">Calculated at checkout</span>
            </div>
          </div>

          <USeparator />

          <div class="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span class="text-(--ui-primary)">{{ formatPrice(total) }}</span>
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
