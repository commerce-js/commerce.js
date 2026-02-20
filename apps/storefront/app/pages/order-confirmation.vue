<script setup lang="ts">
import type { Order } from '@commercejs/types'

const { t } = useLocalizedString()
const { formatPrice } = usePrice()
const route = useRoute()

const orderId = computed(() => (route.query.orderId || route.query.id) as string)

// Clear cart cookie when we have a confirmed order
if (orderId.value) {
  const cartCookie = useCookie('commerce_cart_id')
  cartCookie.value = null
}

// Read order from Nuxt state (set by checkout.vue on placeOrder)
const placedOrder = useState<Order | null>('commerce_placed_order', () => null)
const order = ref<Order | null>(placedOrder.value)
const loading = ref(!order.value)

onMounted(async () => {
  if (!orderId.value && !order.value) {
    await navigateTo('/products')
    return
  }
  // If we don't already have the order from state, try fetching via API
  if (!order.value && orderId.value) {
    try {
      const config = useRuntimeConfig()
      const apiBase = config.public.commerce?.apiBase || '/api/_commerce'
      order.value = await $fetch<Order>(`${apiBase}/customer/orders/${orderId.value}`)
    }
    catch {
      // Order not found — rare but possible
    }
    finally {
      loading.value = false
    }
  }
  else {
    loading.value = false
  }
  // Clear the placed order state now that we've read it
  placedOrder.value = null
})

useHead({
  title: 'Order Confirmed — CommerceJS',
  meta: [
    { name: 'description', content: 'Your order has been placed successfully.' },
  ],
})
</script>

<template>
  <UContainer class="py-12 md:py-16">
    <!-- Loading -->
    <div v-if="loading" class="max-w-lg mx-auto text-center space-y-4">
      <div class="w-16 h-16 rounded-full bg-accented animate-pulse mx-auto" />
      <div class="h-6 w-48 bg-accented rounded animate-pulse mx-auto" />
      <div class="h-4 w-64 bg-accented rounded animate-pulse mx-auto" />
    </div>

    <!-- Order not found -->
    <CEmptyState
      v-else-if="!order"
      icon="i-heroicons-exclamation-triangle"
      title="Order not found"
      description="We couldn't find this order. It may have already been processed."
      action-label="Go to Homepage"
      action-to="/"
    />

    <!-- Confirmation -->
    <div v-else class="max-w-2xl mx-auto space-y-8">
      <!-- Success header -->
      <div class="text-center space-y-4">
        <div class="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <UIcon name="i-heroicons-check-circle-solid" class="text-5xl text-success" />
        </div>
        <h1 class="text-3xl font-bold text-highlighted">
          Order Confirmed!
        </h1>
        <p class="text-lg text-muted">
          Thank you for your order. Your order number is:
        </p>
        <p class="text-2xl font-mono font-bold text-primary">
          {{ order.orderNumber }}
        </p>
      </div>

      <!-- Order details -->
      <div class="rounded-2xl bg-elevated ring ring-default p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-highlighted text-lg">
            Order Details
          </h2>
          <UBadge :color="order.status === 'pending' ? 'warning' : 'success'" variant="subtle">
            {{ order.status }}
          </UBadge>
        </div>

        <USeparator />

        <!-- Items -->
        <div class="space-y-3">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="flex items-center gap-3"
          >
            <div class="w-14 h-14 rounded-lg overflow-hidden bg-accented shrink-0">
              <img
                v-if="item.image"
                :src="item.image.url"
                :alt="item.image.alt || t(item.name)"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-highlighted truncate">
                {{ t(item.name) }}
              </p>
              <p class="text-xs text-muted">
                Qty: {{ item.quantity }} × {{ formatPrice(item.price) }}
              </p>
            </div>
            <span class="text-sm font-semibold text-highlighted shrink-0">
              {{ formatPrice(item.totalPrice) }}
            </span>
          </div>
        </div>

        <USeparator />

        <!-- Totals -->
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">Subtotal</span>
            <span class="font-medium">{{ formatPrice(order.totals.subtotal) }}</span>
          </div>
          <div v-if="order.totals.shipping" class="flex justify-between">
            <span class="text-muted">Shipping</span>
            <span class="font-medium">{{ formatPrice(order.totals.shipping) }}</span>
          </div>
          <div v-if="order.totals.tax" class="flex justify-between">
            <span class="text-muted">Tax</span>
            <span class="font-medium">{{ formatPrice(order.totals.tax) }}</span>
          </div>
          <div v-if="order.totals.discount" class="flex justify-between">
            <span class="text-muted">Discount</span>
            <span class="font-medium text-success">-{{ formatPrice(order.totals.discount) }}</span>
          </div>
        </div>

        <USeparator />

        <div class="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span class="text-primary">{{ formatPrice(order.totals.total) }}</span>
        </div>
      </div>

      <!-- Shipping & Payment info -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-if="order.shippingAddress" class="rounded-2xl bg-elevated ring ring-default p-5">
          <h3 class="font-medium text-highlighted mb-2">
            Shipping Address
          </h3>
          <p class="text-sm text-muted leading-relaxed">
            {{ order.shippingAddress.firstName }} {{ order.shippingAddress.lastName }}<br>
            {{ order.shippingAddress.street }}<br>
            {{ order.shippingAddress.city }} {{ order.shippingAddress.postalCode }}<br>
            {{ order.shippingAddress.country }}
          </p>
        </div>
        <div class="rounded-2xl bg-elevated ring ring-default p-5">
          <h3 class="font-medium text-highlighted mb-2">
            Payment & Shipping
          </h3>
          <div class="text-sm text-muted space-y-1">
            <p v-if="order.shippingMethod">
              <span class="text-highlighted">Shipping:</span> {{ t(order.shippingMethod.name) }}
            </p>
            <p v-if="order.paymentMethod">
              <span class="text-highlighted">Payment:</span> {{ t(order.paymentMethod.name) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <UButton to="/products" color="primary" size="lg">
          Continue Shopping
        </UButton>
      </div>
    </div>
  </UContainer>
</template>
